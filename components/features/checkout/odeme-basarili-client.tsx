"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { BreakOutOfFrame } from "@/components/features/checkout/break-out-of-frame";
import { SITE_CONFIG } from "@/lib/constants";

interface OdemeBasariliClientProps {
  whatsappNumber?: string;
}

export function OdemeBasariliClient({
  whatsappNumber,
}: OdemeBasariliClientProps) {
  const { clearCart } = useCart();
  const number = whatsappNumber || SITE_CONFIG.whatsappNumber;

  // Ödeme başarıyla tamamlandığı için sepeti burada temizliyoruz.
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <BreakOutOfFrame />
      <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
      <h1 className="mt-4 text-2xl font-bold text-brand-navy">
        Ödemeniz Alındı
      </h1>
      <p className="mt-2 text-gray-600">
        Siparişiniz başarıyla oluşturuldu. Teslimat detayları için kısa
        süre içinde sizinle iletişime geçeceğiz.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-navy hover:text-brand-navy"
        >
          Alışverişe Devam Et
        </Link>
        <a
          href={`https://wa.me/${number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          WhatsApp&apos;tan Bize Ulaşın
        </a>
      </div>
    </div>
  );
}
