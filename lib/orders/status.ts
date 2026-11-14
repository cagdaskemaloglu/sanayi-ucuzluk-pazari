// Sipariş durumları — Sanity şeması, Studio menüsü, e-postalar ve durum
// webhook'u bu tek listeyi kullanır.
//
// Akış:  pending (ödeme bekleniyor) → paid (yeni sipariş) → preparing
//        → shipped → delivered.  Her an cancelled'a geçebilir.
//        failed: PayTR ödemesi başarısız oldu (sistem yazar).
//
// pending / paid / failed durumlarını ödeme sistemi (PayTR bildirimi)
// otomatik yazar; mağaza sahibi Studio'dan preparing → shipped →
// delivered / cancelled ilerletir ve her geçişte müşteriye e-posta gider.

export const ORDER_STATUSES = [
  { value: "pending", title: "⏳ Ödeme Bekleniyor" },
  { value: "paid", title: "🆕 Yeni Sipariş (Ödendi)" },
  { value: "preparing", title: "📦 Hazırlanıyor" },
  { value: "shipped", title: "🚚 Kargolandı" },
  { value: "delivered", title: "✅ Teslim Edildi" },
  { value: "cancelled", title: "↩️ İptal / İade" },
  { value: "failed", title: "❌ Ödeme Başarısız" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

/** Mağaza sahibi bu durumlara geçirdiğinde müşteriye e-posta gider. */
export const CUSTOMER_NOTIFIED_STATUSES: readonly OrderStatus[] = [
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export function orderStatusTitle(status?: string): string {
  return ORDER_STATUSES.find((item) => item.value === status)?.title ?? status ?? "?";
}

export const CARRIERS = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "Sürat Kargo",
  "UPS Kargo",
  "DHL",
  "HepsiJET",
  "Trendyol Express",
  "Kolay Gelsin",
  "Ambar / Nakliye",
  "Diğer",
] as const;
