import type { Metadata } from "next";
import { OdemeClient, type MemberDefaults } from "@/components/features/checkout/odeme-client";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { pickShippingSettings } from "@/lib/shipping";
import { getCurrentCustomerSession } from "@/lib/auth/options";
import { findCustomerById } from "@/lib/auth/customers";

export const metadata: Metadata = {
  title: "Ödeme",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Server Component: kargo ayarlarını ve (giriş yapılmışsa) üyenin kayıtlı
// bilgilerini çekip ödeme formuna aktarır.
export default async function OdemePage() {
  const [siteSettings, session] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCurrentCustomerSession().catch(() => null),
  ]);

  let member: MemberDefaults | null = null;
  if (session) {
    const customer = await findCustomerById(session.id).catch(() => null);
    if (customer) {
      member = {
        fullName: customer.name ?? "",
        email: customer.email,
        phone: customer.phone ?? "",
        city: customer.city ?? "",
        district: customer.district ?? "",
        address: customer.address ?? "",
        taxNumber: customer.taxNumber ?? "",
      };
    }
  }

  return <OdemeClient shipping={pickShippingSettings(siteSettings)} member={member} />;
}
