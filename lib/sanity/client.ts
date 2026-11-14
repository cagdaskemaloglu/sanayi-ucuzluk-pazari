import { createClient } from "next-sanity";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

if (!projectId) {
  console.warn(
    "NEXT_PUBLIC_SANITY_PROJECT_ID tanımlı değil. .env.local dosyanızı kontrol edin."
  );
}

// Veri seti GİZLİ (private) yapıldığında site içeriği okuyabilmek için
// Viewer yetkili bir token gerekir. SANITY_API_READ_TOKEN sunucuya özeldir
// (NEXT_PUBLIC_ öneki yok): bu dosya tarayıcı paketine girse bile orada
// değeri undefined olur, token sızmaz. Tanımlı değilse herkese açık veri
// setinden token'sız okunur (eski davranış).
//
// Neden gerekli: siparişler (müşteri adı, telefon, adres) de bu veri
// setinde tutuluyor; veri seti herkese açıksa bu kayıtlar Sanity API'si
// üzerinden herkes tarafından sorgulanabilir.
const readToken = process.env.SANITY_API_READ_TOKEN;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  ...(readToken ? { token: readToken } : {}),
});
