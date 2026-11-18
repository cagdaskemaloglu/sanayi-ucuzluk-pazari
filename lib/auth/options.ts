import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  createCustomer,
  findCustomerByEmail,
  requireWriteClient,
} from "./customers";
import { isValidEmail, normalizeEmail, verifyPassword } from "./password";

// Üyelik: Google ile giriş + e-posta/şifre. Oturumlar imzalı/şifreli çerez
// (JWT) olarak tutulur; ayrı bir oturum veritabanı yok.
//
// Gerekli env (Vercel): NEXTAUTH_SECRET, NEXTAUTH_URL,
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google yoksa yalnızca e-posta/şifre).

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

/** Giriş formunda gösterilecek hata kodları (signIn sonucu `error`). */
export const AUTH_ERRORS = {
  INVALID: "INVALID_CREDENTIALS",
  NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  LOCKED: "ACCOUNT_LOCKED",
  NO_PASSWORD: "NO_PASSWORD",
} as const;

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function isGoogleLoginEnabled() {
  return googleEnabled;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/giris", error: "/giris" },
  providers: [
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "E-posta ve şifre",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email ?? "");
        const password = credentials?.password ?? "";
        if (!isValidEmail(email) || !password) {
          throw new Error(AUTH_ERRORS.INVALID);
        }

        const customer = await findCustomerByEmail(email);

        if (customer?.lockedUntil && new Date(customer.lockedUntil).getTime() > Date.now()) {
          throw new Error(AUTH_ERRORS.LOCKED);
        }

        const ok = await verifyPassword(password, customer?.passwordHash);
        if (!customer || !ok) {
          if (customer?.passwordHash) {
            const failed = (customer.failedLoginCount ?? 0) + 1;
            const lock = failed >= MAX_FAILED_LOGINS;
            await requireWriteClient()
              .patch(customer._id)
              .set(
                lock
                  ? {
                      failedLoginCount: 0,
                      lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString(),
                    }
                  : { failedLoginCount: failed }
              )
              .commit()
              .catch(() => undefined);
            if (lock) throw new Error(AUTH_ERRORS.LOCKED);
          } else if (customer && !customer.passwordHash) {
            // Yalnızca Google ile kayıtlı hesap.
            throw new Error(AUTH_ERRORS.NO_PASSWORD);
          }
          throw new Error(AUTH_ERRORS.INVALID);
        }

        if (!customer.emailVerified) {
          throw new Error(AUTH_ERRORS.NOT_VERIFIED);
        }

        await requireWriteClient()
          .patch(customer._id)
          .set({ failedLoginCount: 0, lastLoginAt: new Date().toISOString() })
          .unset(["lockedUntil"])
          .commit()
          .catch(() => undefined);

        return { id: customer._id, email: customer.email, name: customer.name ?? null };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return true;

      // Google: yalnızca Google'ın doğruladığı e-postalar kabul edilir. Aynı
      // e-postayla şifreli bir hesap varsa ona bağlanır (e-posta sahipliği
      // Google tarafından kanıtlandığı için güvenli).
      const googleProfile = profile as { email?: string; email_verified?: boolean; sub?: string; name?: string } | undefined;
      const email = normalizeEmail(googleProfile?.email ?? user.email ?? "");
      if (!email || googleProfile?.email_verified !== true) {
        return "/giris?hata=google-dogrulanmamis";
      }

      const now = new Date().toISOString();
      const existing = await findCustomerByEmail(email);
      if (existing) {
        const providers = new Set(existing.authProviders ?? []);
        providers.add("google");
        // Doğrulanmamış bir hesaptaki şifre, e-postanın gerçek sahibi
        // tarafından belirlenmemiş olabilir (biri başkasının e-postasıyla
        // kayıt açıp bırakmış olabilir). Google sahipliği kanıtladığı için
        // o doğrulanmamış şifreyi siliyoruz; sahibi isterse "şifremi
        // unuttum" ile kendi şifresini belirler.
        const dropUnverifiedPassword = !existing.emailVerified && Boolean(existing.passwordHash);
        if (dropUnverifiedPassword) providers.delete("password");
        await requireWriteClient()
          .patch(existing._id)
          .set({
            googleId: googleProfile?.sub ?? account.providerAccountId,
            authProviders: Array.from(providers),
            lastLoginAt: now,
            failedLoginCount: 0,
            ...(existing.emailVerified ? {} : { emailVerified: now }),
            ...(existing.name ? {} : { name: googleProfile?.name ?? user.name ?? "" }),
          })
          .unset([
            "lockedUntil",
            "verifyTokenHash",
            "verifyTokenExpires",
            ...(dropUnverifiedPassword ? ["passwordHash"] : []),
          ])
          .commit();
      } else {
        await createCustomer({
          email,
          name: googleProfile?.name ?? user.name ?? "",
          googleId: googleProfile?.sub ?? account.providerAccountId,
          authProviders: ["google"],
          emailVerified: now,
          lastLoginAt: now,
          kvkkAcceptedAt: now,
        } as Parameters<typeof createCustomer>[0]);
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // İlk girişte üyenin Sanity kimliğini token'a yaz.
      if (user) {
        if (account?.provider === "google") {
          const customer = await findCustomerByEmail(user.email ?? "");
          token.customerId = customer?._id;
          token.name = customer?.name || user.name;
        } else {
          token.customerId = user.id;
        }
        token.email = normalizeEmail(user.email ?? "");
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.customerId as string) ?? "";
        session.user.email = (token.email as string) ?? session.user.email;
      }
      return session;
    },
  },
};

/** Sunucu tarafında oturumdaki üye (yoksa null). */
export async function getCurrentCustomerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name ?? "" };
}
