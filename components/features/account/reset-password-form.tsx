"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, Notice, inputClass, primaryButtonClass } from "./auth-ui";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="space-y-4">
        <Notice tone="error">Şifre sıfırlama linki eksik veya hatalı.</Notice>
        <Link href="/sifremi-unuttum" className="text-sm font-medium text-brand-navy hover:underline">
          Yeni link iste
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/hesap/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Şifre güncellenemedi. Lütfen tekrar deneyin.");
        return;
      }
      router.push(`/giris?sifre=yenilendi&email=${encodeURIComponent(data.email ?? "")}`);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Yeni şifre" htmlFor="reset-password" hint="En az 8 karakter; en az bir harf ve bir rakam.">
        <input id="reset-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Yeni şifre (tekrar)" htmlFor="reset-password2">
        <input id="reset-password2" type="password" required minLength={8} autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputClass} />
      </Field>
      {error && (
        <Notice tone="error">
          {error}{" "}
          <Link href="/sifremi-unuttum" className="underline">
            Yeni link iste
          </Link>
        </Notice>
      )}
      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
      </button>
    </form>
  );
}
