"use client";

import { useState, type FormEvent } from "react";
import { Field, Notice, inputClass, primaryButtonClass } from "./auth-ui";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (newPassword !== newPassword2) {
      setMessage({ tone: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/hesap/sifre-degistir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error || "Şifre güncellenemedi." });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
      setMessage({ tone: "success", text: hasPassword ? "Şifreniz güncellendi." : "Şifreniz belirlendi; artık e-posta ve şifreyle de giriş yapabilirsiniz." });
    } catch {
      setMessage({ tone: "error", text: "Bağlantı hatası. Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hasPassword && (
        <p className="text-sm text-gray-500">
          Hesabınız Google ile oluşturuldu. İsterseniz e-posta ve şifreyle de giriş yapabilmek için bir şifre belirleyin.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {hasPassword && (
          <Field label="Mevcut şifre" htmlFor="pw-current">
            <input id="pw-current" type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </Field>
        )}
        <Field label="Yeni şifre" htmlFor="pw-new">
          <input id="pw-new" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Yeni şifre (tekrar)" htmlFor="pw-new2">
          <input id="pw-new2" type="password" required minLength={8} autoComplete="new-password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} className={inputClass} />
        </Field>
      </div>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <div className="sm:w-48">
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Kaydediliyor..." : hasPassword ? "Şifreyi Değiştir" : "Şifre Belirle"}
        </button>
      </div>
    </form>
  );
}
