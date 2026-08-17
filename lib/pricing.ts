export const UNIT_LABELS: Record<string, string> = {
  adet: "Adet",
  kutu: "Kutu",
  koli: "Koli",
  palet: "Palet",
};

export function formatPrice(price: number) {
  return `${price.toLocaleString("tr-TR")} ₺`;
}

export interface BulkTierLike {
  minQuantity: number;
  price: number;
}

/**
 * Miktara göre uygulanacak birim fiyatı döndürür. bulkTiers içinde
 * miktarın karşıladığı en yüksek eşikli (en avantajlı) kademe varsa
 * onu, yoksa temel fiyatı kullanır.
 */
export function getEffectiveUnitPrice(
  basePrice: number,
  quantity: number,
  bulkTiers?: BulkTierLike[]
): number {
  if (!bulkTiers?.length) return basePrice;

  const applicableTier = [...bulkTiers]
    .filter((tier) => quantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];

  return applicableTier ? applicableTier.price : basePrice;
}

// Sanity'de fiyatlar hep KDV HARİÇ girilir. Bir ürüne KDV oranı
// girilmediyse (eski ürünler/varsayılan) Türkiye standart oranı %20
// kabul edilir.
export const DEFAULT_VAT_RATE = 20;

export function getVatAmount(amountExcludingVat: number, vatRate?: number): number {
  const rate = vatRate ?? DEFAULT_VAT_RATE;
  return amountExcludingVat * (rate / 100);
}

export function getAmountIncludingVat(
  amountExcludingVat: number,
  vatRate?: number
): number {
  return amountExcludingVat + getVatAmount(amountExcludingVat, vatRate);
}
