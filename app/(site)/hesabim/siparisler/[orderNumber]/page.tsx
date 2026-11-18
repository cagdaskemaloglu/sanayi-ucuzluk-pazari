import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Truck } from "lucide-react";
import { getCurrentCustomerSession } from "@/lib/auth/options";
import { getCustomerOrder } from "@/lib/auth/orders";
import { formatPrice } from "@/lib/pricing";
import { OrderStatusBadge } from "@/components/features/account/order-status-badge";

export const metadata: Metadata = {
  title: "Sipariş Detayı",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STEPS = [
  { status: "paid", label: "Sipariş alındı" },
  { status: "preparing", label: "Hazırlanıyor" },
  { status: "shipped", label: "Kargoda" },
  { status: "delivered", label: "Teslim edildi" },
];

function safeHttpUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export default async function SiparisDetayPage({ params }: { params: { orderNumber: string } }) {
  const orderNumber = decodeURIComponent(params.orderNumber);
  const session = await getCurrentCustomerSession();
  if (!session) redirect(`/giris?callbackUrl=${encodeURIComponent(`/hesabim/siparisler/${orderNumber}`)}`);

  const order = await getCustomerOrder({ id: session.id, email: session.email }, orderNumber);
  if (!order) notFound();

  const stepIndex = STEPS.findIndex((step) => step.status === order.status);
  const trackingUrl = safeHttpUrl(order.trackingUrl);
  const created = new Date(order.createdAt).toLocaleString("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/hesabim" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-navy">
        <ChevronLeft className="h-4 w-4" />
        Siparişlerim
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Sipariş No: {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{created}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status !== "cancelled" && stepIndex >= 0 && (
        <ol className="mt-6 grid grid-cols-4 gap-2">
          {STEPS.map((step, index) => (
            <li key={step.status} className="text-center">
              <div className={`h-1.5 rounded-full ${index <= stepIndex ? "bg-brand-navy" : "bg-gray-200"}`} />
              <span className={`mt-1.5 block text-[11px] sm:text-xs ${index <= stepIndex ? "font-medium text-brand-navy" : "text-gray-400"}`}>
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {(order.status === "shipped" || order.status === "delivered") && (order.carrier || order.trackingNumber) && (
        <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          <p className="flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4" />
            Kargo Bilgisi
          </p>
          <p className="mt-1">
            {order.carrier && <>Kargo firması: <strong>{order.carrier}</strong><br /></>}
            {order.trackingNumber && <>Takip numarası: <strong>{order.trackingNumber}</strong></>}
          </p>
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800">
              Kargomu Takip Et
            </a>
          )}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-brand-navy">Ürünler</h2>
        <ul className="divide-y divide-gray-100">
          {order.items?.map((item, index) => (
            <li key={index} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-gray-800">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  {item.unitLabel} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 font-medium text-gray-800">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-gray-200 px-4 py-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <dt>Ürünler (KDV dahil)</dt>
            <dd>{formatPrice(order.totalIncludingVat)}</dd>
          </div>
          {order.totalVat !== undefined && (
            <div className="flex justify-between text-xs text-gray-400">
              <dt>KDV</dt>
              <dd>{formatPrice(order.totalVat)}</dd>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <dt>Kargo</dt>
            <dd>{order.shippingFee ? formatPrice(order.shippingFee) : "Ücretsiz"}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-1 font-semibold text-brand-navy">
            <dt>Toplam</dt>
            <dd>{formatPrice(order.grandTotal ?? order.totalIncludingVat)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <h2 className="font-semibold text-brand-navy">Teslimat Bilgileri</h2>
        <p className="mt-2 leading-relaxed text-gray-700">
          {order.customerName} {order.customerSurname}
          <br />
          {order.customerAddress}
          <br />
          {order.customerDistrict ? `${order.customerDistrict} / ` : ""}
          {order.customerCity}
          <br />
          {order.customerPhone}
          {order.customerTaxNumber && (
            <>
              <br />
              VKN/TCKN: {order.customerTaxNumber}
            </>
          )}
        </p>
      </section>

      <p className="mt-6 text-xs text-gray-400">
        Siparişinizle ilgili bir sorun mu var? WhatsApp&apos;tan veya{" "}
        <Link href="/iletisim" className="underline">
          iletişim
        </Link>{" "}
        sayfasından bize ulaşın. İade koşulları için{" "}
        <Link href="/iade-ve-kargo" className="underline">
          İade ve Kargo
        </Link>
        .
      </p>
    </div>
  );
}
