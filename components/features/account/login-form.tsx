"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Field,
  GoogleButton,
  Notice,
  OrDivider,
  inputClass,
  primaryButtonClass,
} from "./auth-ui";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "E-posta veya şifre hatalı.",
  EMAIL_NOT_VERIFIED:
    "E-posta adresiniz henüz doğrulanmadı. Kayıt olurken gönderdiğimiz e-postadaki linke tıklayın (spam klasörünü de kontrol edin).",
  ACCOUNT_LOCKED: "Çok sayıda hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin veya şifrenizi sıfırlayın.",
  NO_PASSWORD:
    "Bu hesap Google ile oluşturulmuş. 'Google ile devam et' ile giriş yapın veya 'Şifremi unuttum' ile şifre belirleyin.",
};

export function LoginForm({
  callbackUrl,
  googleEnabled,
  initialEmail,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
  initialEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        setError(ERROR_MESSAGES[result?.error ?? ""] ?? "Giriş yapılamadı. Lütfen tekrar deneyin.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl} />
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Google ile devam ederek{" "}
            <Link href="/kvkk" className="underline">
              KVKK Aydınlatma Metni
            </Link>
            &apos;ni okuduğunuzu kabul edersiniz.
          </p>
          <OrDivider />
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-posta" htmlFor="login-email">
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Şifre" htmlFor="login-password">
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/sifremi-unuttum" className="text-xs text-brand-navy hover:underline">
            Şifremi unuttum
          </Link>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Hesabınız yok mu?{" "}
        <Link
          href={`/kayit${callbackUrl !== "/hesabim" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-medium text-brand-navy hover:underline"
        >
          Üye olun
        </Link>
      </p>
    </div>
  );
}
