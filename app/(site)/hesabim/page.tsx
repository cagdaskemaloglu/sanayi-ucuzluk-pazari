import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { getCurrentCustomerSession } from "@/lib/auth/options";
import { findCustomerById, toProfile } from "@/lib/auth/customers";
import { getCustomerOrders } from "@/lib/auth/orders";
import { formatPrice } from "@/lib/pricing";
import { OrderStatusBadge } from "@/components/features/account/order-status-badge";
import { ProfileForm } from "@/components/features/account/profile-form";
import { ChangePasswordForm } from "@/components/features/account/change-password-form";
import { LogoutButton } from "@/components/features/account/logout-button";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
}

export default async function HesabimPage() {
  const session = await getCurrentCustomerSession();
  if (!session) redirect("/giris?callbackUrl=/hesabim");

  const customer = await findCustomerById(session.id);
  if (!customer) redirect("/api/auth/signout");
  const profile = toProfile(customer);
  const orders = await getCustomerOrders({ id: profile.id, email: profile.email });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Hesabım</h1>
          <p className="text-sm text-gray-500">
            Hoş geldiniz{profile.name ? `, ${profile.name}` : ""}.
          </p>
        </div>
        <LogoutButton />
      </div>

      <section id="siparislerim" className="mt-8">
        <h2 className="text-lg font-semibold text-brand-navy">Siparişlerim</h2>
        {orders.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
            <Package className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">Henüz siparişiniz yok.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand-navy hover:underline">
              Alışverişe başla
            </Link>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {orders.map((order) => (
              <li key={order.orderNumber}>
                <Link
                  href={`/hesabim/siparisler/${encodeURIComponent(order.orderNumber)}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{formatDate(order.createdAt)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {order.firstItemName}
                      {order.itemCount > 1 ? ` ve ${order.itemCount - 1} ürün daha` : ""} · No: {order.orderNumber}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-brand-navy">
                    {formatPrice(order.grandTotal ?? order.totalIncludingVat ?? 0)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Kartla ödenen siparişler burada listelenir. WhatsApp üzerinden verilen siparişler için bizimle WhatsApp&apos;tan iletişime geçebilirsiniz.
        </p>
      </section>

      <section id="bilgilerim" className="mt-10 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-brand-navy">Bilgilerim</h2>
        <ProfileForm profile={profile} />
      </section>

      <section id="sifre" className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-brand-navy">{profile.hasPassword ? "Şifre Değiştir" : "Şifre Belirle"}</h2>
        <ChangePasswordForm hasPassword={profile.hasPassword} />
      </section>
    </div>
  );
}
