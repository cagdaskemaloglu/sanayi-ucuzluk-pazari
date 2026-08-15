import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    type: "website",
    locale: "tr_TR",
    siteName: SITE_CONFIG.name,
  },
};

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
