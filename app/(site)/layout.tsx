import { SiteHeader } from "@/components/features/header/site-header";
import { TopContactBar } from "@/components/features/header/top-contact-bar";
import { FreeShippingBar } from "@/components/features/header/free-shipping-bar";
import { StoreSettingsProvider } from "@/lib/store/store-settings";
import { AuthSessionProvider } from "@/components/features/account/auth-session-provider";
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
  const storeSettings = {
    delivery: {
      cutoffHour: siteSettings?.shippingCutoffHour ?? null,
      sundayShipping: siteSettings?.sundayShipping ?? null,
    },
    shipping: pickShippingSettings(siteSettings),
  };

  return (
    <AuthSessionProvider>
      <StoreSettingsProvider value={storeSettings}>
        <CartProvider>
          <TopContactBar siteSettings={siteSettings} />
          <FreeShippingBar siteSettings={siteSettings} />
          <SiteHeader siteSettings={siteSettings} />
          {/* pb: sağ alttaki WhatsApp butonu sayfa sonundaki içeriği örtmesin */}
          <main className="min-h-[60vh] pb-16">{children}</main>
          <AboutSection siteSettings={siteSettings} />
          <SiteFooter siteSettings={siteSettings} />
          <WhatsappFloatingButton whatsappNumber={siteSettings?.whatsappNumber} />
          <CartSheet
            whatsappNumber={siteSettings?.whatsappNumber}
            shipping={pickShippingSettings(siteSettings)}
          />
          <Analytics />
        </CartProvider>
      </StoreSettingsProvider>
    </AuthSessionProvider>
  );
}
