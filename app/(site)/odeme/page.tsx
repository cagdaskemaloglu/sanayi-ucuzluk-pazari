import type { Metadata } from "next";
import { OdemeClient } from "@/components/features/checkout/odeme-client";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { pickShippingSettings } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Ödeme",
  robots: { index: false, follow: false },
};

// Server Component: kargo ayarlarını Sanity'den çekip ödeme formuna aktarır.
export default async function OdemePage() {
  const siteSettings = await getSiteSettings().catch(() => null);

  return <OdemeClient shipping={pickShippingSettings(siteSettings)} />;
}
