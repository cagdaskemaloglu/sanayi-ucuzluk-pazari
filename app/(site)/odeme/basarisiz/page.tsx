import Link from "next/link";
import { XCircle } from "lucide-react";
import { BreakOutOfFrame } from "@/components/features/checkout/break-out-of-frame";

export default function OdemeBasarisizPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <BreakOutOfFrame />
      <XCircle className="mx-auto h-14 w-14 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold text-brand-navy">
        Ödeme Tamamlanamadı
      </h1>
      <p className="mt-2 text-gray-600">
        Ödeme işlemi sırasında bir sorun oluştu ya da işlem iptal edildi.
        Sepetiniz hâlâ duruyor, tekrar deneyebilir veya WhatsApp üzerinden
        sipariş verebilirsiniz.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/odeme"
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-dark"
        >
          Tekrar Dene
        </Link>
        <Link
          href="/"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-navy hover:text-brand-navy"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
