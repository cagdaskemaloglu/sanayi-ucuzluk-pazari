"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { TurnstileWidget } from "@/components/features/cart/turnstile-widget";
import { Field, Notice, inputClass, primaryButtonClass } from "./auth-ui";

const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/hesap/sifre-istek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "İstek gönderilemedi. Lütfen tekrar deneyin.");
        setTurnstileToken(null);
        setTurnstileKey((key) => key + 1);
        return;
      }
      setSent(true);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Notice tone="success">
          Bu e-posta adresiyle bir üyelik varsa, şifre sıfırlama linki gönderdik. Link 1 saat geçerlidir.
        </Notice>
        <p className="text-sm text-gray-500">E-posta gelmediyse spam/gereksiz klasörünü kontrol edin.</p>
        <Link href="/giris" className="inline-block text-sm font-medium text-brand-navy hover:underline">
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="E-posta" htmlFor="forgot-email">
        <input id="forgot-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </Field>
      <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} />
      {error && <Notice tone="error">{error}</Notice>}
      <button type="submit" disabled={loading || (turnstileRequired && !turnstileToken)} className={primaryButtonClass}>
        {loading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
      </button>
      <p className="text-center text-sm">
        <Link href="/giris" className="text-brand-navy hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </form>
  );
}
