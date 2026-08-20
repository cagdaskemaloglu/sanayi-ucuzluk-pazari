"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice, UNIT_LABELS } from "@/lib/pricing";
import { isValidTcKimlikNo } from "@/lib/validation";
import { IyzicoCheckoutForm } from "@/components/features/checkout/iyzico-checkout-form";

interface BuyerForm {
  name: string;
  surname: string;
  email: string;
  phone: string;
  identityNumber: string;
  city: string;
  address: string;
}

export default function OdemePage() {
  const {
    items,
    itemsWithVat,
    customerAddress,
    totalPriceExcludingVat,
    totalVatAmount,
    totalPriceIncludingVat,
  } = useCart();

  const [form, setForm] = useState<BuyerForm>({
    name: "",
    surname: "",
    email: "",
    phone: "",
    identityNumber: "",
    city: "",
    address: customerAddress || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutFormContent, setCheckoutFormContent] = useState<
    string | null
  >(null);

  function updateField(field: keyof BuyerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidTcKimlikNo(form.identityNumber)) {
      setError(
        "Girdiğiniz TC Kimlik No geçerli değil. Lütfen 11 haneli, doğru kimlik numaranızı girin."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/odeme/baslat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer: form,
          items: itemsWithVat.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitLabel: UNIT_LABELS[item.unitType] ?? item.unitType,
            quantity: item.quantity,
            lineTotalIncludingVat: item.lineTotalIncludingVat,
          })),
          totalExcludingVat: totalPriceExcludingVat,
          totalVat: totalVatAmount,
          totalPriceIncludingVat,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Bir hata oluştu, lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      setCheckoutFormContent(data.checkoutFormContent);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !checkoutFormContent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-brand-navy">Sepetiniz boş</h1>
        <p className="mt-2 text-gray-600">
          Ödeme yapabilmek için önce sepetinize ürün ekleyin.
        </p>
        <Link href="/" className="mt-4 inline-block text-brand-navy underline">
          Ürünlere dön
        </Link>
      </div>
    );
  }

  if (checkoutFormContent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-6 text-xl font-bold text-brand-navy">Ödeme</h1>
        <IyzicoCheckoutForm checkoutFormContent={checkoutFormContent} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-xl font-bold text-brand-navy">Ödeme Bilgileri</h1>
      <p className="mt-1 text-sm text-gray-500">
        Toplam (KDV Dahil):{" "}
        <span className="font-semibold text-brand-navy">
          {formatPrice(totalPriceIncludingVat)}
        </span>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Ad</label>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Soyad</label>
            <input
              required
              value={form.surname}
              onChange={(event) => updateField("surname", event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">E-posta</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Telefon
          </label>
          <input
            required
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="05XXXXXXXXX"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            TC Kimlik No
          </label>
          <input
            required
            maxLength={11}
            inputMode="numeric"
            value={form.identityNumber}
            onChange={(event) =>
              updateField(
                "identityNumber",
                event.target.value.replace(/\D/g, "")
              )
            }
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
          <p className="mt-1 text-xs text-gray-400">
            Ödeme altyapısı (iyzico) tarafından kimlik doğrulama için
            zorunlu tutulur.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Şehir</label>
          <input
            required
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Adres</label>
          <textarea
            required
            rows={3}
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            className="mt-1 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark disabled:pointer-events-none disabled:opacity-50"
        >
          {loading
            ? "Yönlendiriliyor..."
            : `Ödemeye Geç — ${formatPrice(totalPriceIncludingVat)}`}
        </button>
      </form>
    </div>
  );
}
