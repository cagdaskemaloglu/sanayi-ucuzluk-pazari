"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/pricing";
import { PaytrCheckoutFrame } from "@/components/features/checkout/paytr-checkout-frame";
import { calculateShippingFee, type ShippingSettings } from "@/lib/shipping";

interface BuyerForm {
  name: string;
  surname: string;
  email: string;
  phone: string;
  city: string;
  address: string;
}

const EMPTY_FORM: BuyerForm = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  city: "",
  address: "",
};

// Sepetteki "Ad Soyad" tek alan; ödeme formunda ad ve soyad ayrı. Son
// kelime soyad, öncekiler ad kabul edilir ("Ahmet Can Yılmaz" → "Ahmet
// Can" + "Yılmaz"). Telefondaki boşluk/parantez/tireler temizlenir.
function buyerFromCart(
  fullName: string,
  address: string,
  phone: string
): Partial<BuyerForm> {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const surname = parts.length > 1 ? parts.pop() ?? "" : "";
  return {
    name: parts.join(" "),
    surname,
    address: address.trim(),
    phone: phone.replace(/[\s()-]/g, ""),
  };
}

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

interface OdemeClientProps {
  shipping: ShippingSettings;
}

export function OdemeClient({ shipping }: OdemeClientProps) {
  const {
    items,
    customerName,
    customerAddress,
    customerPhone,
    hydrated,
    totalPriceIncludingVat,
  } = useCart();
  // Gösterim içindir; tahsil edilen tutar sunucuda aynı fonksiyonla
  // Sanity'deki güncel fiyatlarla yeniden hesaplanır.
  const shippingFee = calculateShippingFee(totalPriceIncludingVat, shipping);
  const grandTotal = Math.round((totalPriceIncludingVat + shippingFee) * 100) / 100;
  const threshold = shipping.freeShippingThreshold;
  const remainingForFreeShipping =
    shippingFee > 0 && threshold ? threshold - totalPriceIncludingVat : 0;

  const [form, setForm] = useState<BuyerForm>(() => ({
    ...EMPTY_FORM,
    ...buyerFromCart(customerName, customerAddress, customerPhone),
  }));

  // Sayfa doğrudan açıldıysa (veya yenilendiyse) sepet localStorage'dan
  // biraz sonra yüklenir; o an hâlâ boş olan alanları sepetteki bilgilerle
  // bir kez doldur — kullanıcının yazdıklarının üzerine yazma.
  const prefilledFromCart = useRef(false);
  useEffect(() => {
    if (!hydrated || prefilledFromCart.current) return;
    prefilledFromCart.current = true;
    const fromCart = buyerFromCart(customerName, customerAddress, customerPhone);
    setForm((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(fromCart) as (keyof BuyerForm)[]) {
        if (!next[key].trim() && fromCart[key]) next[key] = fromCart[key] ?? "";
      }
      return next;
    });
  }, [hydrated, customerName, customerAddress, customerPhone]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  function updateField(field: keyof BuyerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Fiyat göndermiyoruz: sunucu tutarı Sanity'deki güncel veriden kendisi hesaplar.
      const response = await fetch("/api/odeme/baslat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer: form,
          items: items.map((item) => ({
            productId: item.productId,
            unitType: item.unitType,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Bir hata oluştu, lütfen tekrar deneyin.");
        return;
      }

      setPaymentToken(data.token);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !paymentToken) {
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

  if (paymentToken) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-6 text-xl font-bold text-brand-navy">Ödeme</h1>
        <PaytrCheckoutFrame token={paymentToken} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-xl font-bold text-brand-navy">Ödeme Bilgileri</h1>
      <div className="mt-3 space-y-1 rounded-md border border-gray-200 bg-white p-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Ürünler (KDV dahil)</span>
          <span>{formatPrice(totalPriceIncludingVat)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Kargo</span>
          <span>{shippingFee > 0 ? formatPrice(shippingFee) : "Ücretsiz"}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-brand-navy">
          <span>Toplam</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
        {remainingForFreeShipping > 0 && (
          <p className="pt-1 text-xs text-green-700">
            {formatPrice(Math.round(remainingForFreeShipping * 100) / 100)} daha
            ekleyin, kargo ücretsiz olsun.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ad" htmlFor="buyer-name">
            <input
              id="buyer-name"
              required
              autoComplete="given-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Soyad" htmlFor="buyer-surname">
            <input
              id="buyer-surname"
              required
              autoComplete="family-name"
              value={form.surname}
              onChange={(event) => updateField("surname", event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="E-posta" htmlFor="buyer-email">
          <input
            id="buyer-email"
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Telefon" htmlFor="buyer-phone">
          <input
            id="buyer-phone"
            required
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="05XXXXXXXXX"
            className={inputClass}
          />
        </Field>

        <Field label="Şehir" htmlFor="buyer-city">
          <input
            id="buyer-city"
            required
            autoComplete="address-level1"
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Adres" htmlFor="buyer-address">
          <textarea
            id="buyer-address"
            required
            rows={3}
            autoComplete="street-address"
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark disabled:pointer-events-none disabled:opacity-50"
        >
          {loading
            ? "Yönlendiriliyor..."
            : `Ödemeye Geç — ${formatPrice(grandTotal)}`}
        </button>

        <p className="text-center text-xs text-gray-400">
          Ödeme, PayTR güvenli ödeme sayfasında alınır. Kart bilgileriniz bu
          sitede saklanmaz.
        </p>
      </form>
    </div>
  );
}
