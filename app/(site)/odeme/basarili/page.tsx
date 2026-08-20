import { getSiteSettings } from "@/lib/sanity/fetchers";
import { OdemeBasariliClient } from "@/components/features/checkout/odeme-basarili-client";

// Server Component: gerçek WhatsApp numarasını Sanity'den çekip
// client bileşene aktarır (client bileşenler siteSettings'i doğrudan
// çekemez, sepeti temizlemek için "use client" olması gerekiyor).
export default async function OdemeBasariliPage() {
  const siteSettings = await getSiteSettings();

  return <OdemeBasariliClient whatsappNumber={siteSettings?.whatsappNumber} />;
}
