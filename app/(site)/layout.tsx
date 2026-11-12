import { SiteHeader } from "@/components/features/header/site-header";
import { TopContactBar } from "@/components/features/header/top-contact-bar";
import { SiteFooter } from "@/components/features/footer/site-footer";
import { AboutSection } from "@/components/features/about/about-section";
import { WhatsappFloatingButton } from "@/components/features/whatsapp-button/whatsapp-floating-button";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartSheet } from "@/components/features/cart/cart-sheet";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { Analytics } from "@vercel/analytics/react";
import { pickShippingSettings } from "@/lib/shipping";

// Bu layout SADECE normal site sayfalarına (/, /urun/[slug], vb.) uygulanır.
// /studio route'u bu grubun DIŞINDA olduğu için Sanity Studio kendi tam
// ekran arayüzünü header/footer olmadan, sorunsuz çalıştırabilir.
// Sepet (CartProvider) da sadece burada — Studio'nun bu state'e ihtiyacı yok.
// Analytics de burada — Studio'daki (admin) trafiği ziyaretçi
// istatistiklerine karıştırmamak için.
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <CartProvider>
      <TopContactBar siteSettings={siteSettings} />
      <SiteHeader siteSettings={siteSettings} />
      <main className="min-h-[60vh]">{children}</main>
      <AboutSection siteSettings={siteSettings} />
      <SiteFooter siteSettings={siteSettings} />
      <WhatsappFloatingButton whatsappNumber={siteSettings?.whatsappNumber} />
      <CartSheet
        whatsappNumber={siteSettings?.whatsappNumber}
        shipping={pickShippingSettings(siteSettings)}
      />
      <Analytics />
    </CartProvider>
  );
}
