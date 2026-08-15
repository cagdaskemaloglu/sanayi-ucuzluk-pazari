export const SITE_CONFIG = {
  name: "Sanayi Ucuzluk Pazarı",
  description: "Sanayi ve hırdavat ürünlerinde toptan ve perakende satış",
  // Vercel'e alınca .env'e NEXT_PUBLIC_SITE_URL olarak gerçek domaini gir.
  // Boşsa localhost'a düşer, sitemap/robots/JSON-LD'yi bozmaz.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsappNumber: "905XXXXXXXXX", // Sanity siteSettings'ten yönetilecek, şimdilik placeholder
  phone: "+90 5XX XXX XX XX",
  email: "info@sanayiucuzlukpazari.com",
  address: "İstanbul, Türkiye",
} as const;

export const CART_STORAGE_KEY = "sup-cart";
