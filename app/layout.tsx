import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/constants";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { urlForImage } from "@/lib/sanity/image";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// generateMetadata (statik "metadata" export yerine) kullanıyoruz çünkü
// başlık/açıklama/favicon artık Sanity'den (Site Ayarları) geliyor.
// Sanity'ye erişilemezse (ör. build sırasında env eksikse) sessizce
// varsayılan SITE_CONFIG değerlerine düşer, site kırılmaz.
export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings().catch(() => null);

  const title = siteSettings?.siteTitle || SITE_CONFIG.name;
  const description = siteSettings?.siteDescription || SITE_CONFIG.description;
  const faviconUrl = siteSettings?.favicon
    ? urlForImage(siteSettings.favicon).width(64).height(64).url()
    : undefined;

  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "tr_TR",
      siteName: title,
    },
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
  };
}

// Root layout tüm route'lara (site sayfaları + /studio) uygulanır.
// Header/footer/whatsapp butonu burada DEĞİL — onlar sadece
// app/(site)/layout.tsx içinde, /studio'yu etkilememesi için.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body
        className={`${inter.variable} min-h-screen bg-gray-50 font-sans text-gray-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
