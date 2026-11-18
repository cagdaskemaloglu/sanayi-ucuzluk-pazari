"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { TurnstileWidget } from "@/components/features/cart/turnstile-widget";
import {
  Field,
  GoogleButton,
  Notice,
  OrDivider,
  inputClass,
  primaryButtonClass,
} from "./auth-ui";

const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function RegisterForm({ callbackUrl, googleEnabled }: { callbackUrl: string; googleEnabled: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", password2: "" });
  const [kvkk, setKvkk] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.password !== form.password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/hesap/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, kvkk, turnstileToken }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Kayıt yapılamadı. Lütfen tekrar deneyin.");
        // Turnstile kodu tek kullanımlık: yenisini al.
        setTurnstileToken(null);
        setTurnstileKey((key) => key + 1);
        return;
      }
      setSentTo(form.email.trim().toLowerCase());
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <Notice tone="success">
          Neredeyse bitti! <strong>{sentTo}</strong> adresine bir doğrulama e-postası gönderdik.
          E-postadaki linke tıklayarak üyeliğinizi tamamlayın.
        </Notice>
        <p className="text-sm text-gray-500">
          E-posta gelmediyse spam/gereksiz klasörünü kontrol edin. Birkaç dakika içinde gelmezse
          bu sayfaya dönüp tekrar kayıt olarak yeni bir link isteyebilirsiniz.
        </p>
        <Link href="/giris" className="inline-block text-sm font-medium text-brand-navy hover:underline">
          Giriş sayfasına git
        </Link>
      </div>
    );
  }

  return (
    <div>
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl} label="Google ile üye ol" />
          <OrDivider />
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Ad Soyad" htmlFor="reg-name">
          <input id="reg-name" required autoComplete="name" maxLength={60} value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="E-posta" htmlFor="reg-email">
          <input id="reg-email" type="email" required autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Şifre" htmlFor="reg-password" hint="En az 8 karakter; en az bir harf ve bir rakam.">
          <input id="reg-password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Şifre (tekrar)" htmlFor="reg-password2">
          <input id="reg-password2" type="password" required minLength={8} autoComplete="new-password" value={form.password2} onChange={(e) => update("password2", e.target.value)} className={inputClass} />
        </Field>

        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input type="checkbox" required checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-navy" />
          <span>
            <Link href="/kvkk" target="_blank" className="text-brand-navy underline">
              KVKK Aydınlatma Metni
            </Link>
            &apos;ni okudum, kişisel verilerimin üyelik kapsamında işlenmesini kabul ediyorum.
          </span>
        </label>

        <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} />

        {error && <Notice tone="error">{error}</Notice>}

        <button type="submit" disabled={loading || (turnstileRequired && !turnstileToken)} className={primaryButtonClass}>
          {loading ? "Kaydediliyor..." : "Üye Ol"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Zaten üye misiniz?{" "}
        <Link href="/giris" className="font-medium text-brand-navy hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
