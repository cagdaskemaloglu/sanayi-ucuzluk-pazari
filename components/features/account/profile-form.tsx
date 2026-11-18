"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TR_PROVINCES, getDistricts } from "@/lib/data/tr-locations";
import type { CustomerProfile } from "@/lib/auth/customers";
import { Field, Notice, inputClass, primaryButtonClass } from "./auth-ui";

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    city: profile.city,
    district: profile.district,
    address: profile.address,
    taxNumber: profile.taxNumber,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value, ...(field === "city" ? { district: "" } : {}) }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch("/api/hesap/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error || "Bilgiler kaydedilemedi." });
        return;
      }
      setMessage({ tone: "success", text: "Bilgileriniz kaydedildi. Ödeme formu bundan sonra bu bilgilerle dolu gelir." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Bağlantı hatası. Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  }

  const districts = form.city ? getDistricts(form.city) : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ad Soyad" htmlFor="profile-name">
          <input id="profile-name" required maxLength={60} autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="E-posta" htmlFor="profile-email" hint="E-posta adresi değiştirilemez.">
          <input id="profile-email" value={profile.email} disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
        </Field>
        <Field label="Telefon" htmlFor="profile-phone">
          <input id="profile-phone" type="tel" autoComplete="tel" placeholder="05XXXXXXXXX" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Vergi Kimlik No / TC Kimlik No (opsiyonel)" htmlFor="profile-tax">
          <input id="profile-tax" inputMode="numeric" value={form.taxNumber} onChange={(e) => update("taxNumber", e.target.value.replace(/\D/g, "").slice(0, 11))} className={inputClass} />
        </Field>
        <Field label="İl" htmlFor="profile-city">
          <select id="profile-city" autoComplete="address-level1" value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass}>
            <option value="">İl seçin</option>
            {TR_PROVINCES.map((province) => (
              <option key={province.il} value={province.il}>
                {province.il}
              </option>
            ))}
          </select>
        </Field>
        <Field label="İlçe" htmlFor="profile-district">
          <select
            id="profile-district"
            autoComplete="address-level2"
            value={form.district}
            disabled={!form.city}
            required={Boolean(form.city)}
            onChange={(e) => update("district", e.target.value)}
            className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
          >
            <option value="">{form.city ? "İlçe seçin" : "Önce il seçin"}</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Teslimat Adresi" htmlFor="profile-address">
        <textarea id="profile-address" rows={3} maxLength={400} autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} className={`${inputClass} resize-none`} />
      </Field>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <div className="sm:w-48">
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Kaydediliyor..." : "Bilgilerimi Kaydet"}
        </button>
      </div>
    </form>
  );
}
