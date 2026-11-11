import { SITE_CONFIG } from "@/lib/constants";
import { getSiteSettings } from "@/lib/sanity/fetchers";

// Yasal sayfalar ve iade/kargo sayfası için işletme iletişim bilgileri.
// Sanity Site Ayarları'ndaki gerçek bilgiler kullanılır; girilmemişse
// SITE_CONFIG varsayılanlarına düşer.
export async function getBusinessContact() {
  const siteSettings = await getSiteSettings().catch(() => null);
  return {
    siteSettings,
    name: siteSettings?.siteTitle || SITE_CONFIG.name,
    address: siteSettings?.address || SITE_CONFIG.address,
    email: siteSettings?.email || SITE_CONFIG.email,
    phone: siteSettings?.phone || SITE_CONFIG.phone,
  };
}
