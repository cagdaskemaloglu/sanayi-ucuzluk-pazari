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
