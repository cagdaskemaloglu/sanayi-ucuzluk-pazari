import { NextResponse } from "next/server";
import { findCustomerByTokenHash, isExpired, requireWriteClient } from "@/lib/auth/customers";
import { hashPassword, hashToken, validatePasswordStrength } from "@/lib/auth/password";
import { jsonError, readJson } from "@/lib/auth/api-helpers";

export const dynamic = "force-dynamic";

// Sıfırlama linkindeki kodla yeni şifre belirleme. Link e-postaya gittiği
// için e-posta sahipliği de kanıtlanmış olur (hesap doğrulanır).
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Geçersiz istek.");

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  const passwordError = validatePasswordStrength(password);
  if (passwordError) return jsonError(passwordError);

  const customer = token ? await findCustomerByTokenHash("resetTokenHash", hashToken(token)) : null;
  if (!customer || isExpired(customer.resetTokenExpires)) {
    return jsonError("Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeniden talep edin.", 410);
  }

  const providers = new Set(customer.authProviders ?? []);
  providers.add("password");
  await requireWriteClient()
    .patch(customer._id)
    .set({
      passwordHash: await hashPassword(password),
      authProviders: Array.from(providers),
      failedLoginCount: 0,
      ...(customer.emailVerified ? {} : { emailVerified: new Date().toISOString() }),
    })
    .unset(["resetTokenHash", "resetTokenExpires", "lockedUntil", "verifyTokenHash", "verifyTokenExpires"])
    .commit();

  return NextResponse.json({ ok: true, email: customer.email });
}
