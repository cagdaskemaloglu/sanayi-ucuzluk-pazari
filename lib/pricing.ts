export const UNIT_LABELS: Record<string, string> = {
  adet: "Adet",
  kutu: "Kutu",
  koli: "Koli",
  palet: "Palet",
};

import type { PricingOption } from "@/lib/sanity/types";

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

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/** Bir satış biriminde kaç adet olduğu (adet birimi ve boş alan için 1). */
export function piecesInUnit(option: Pick<PricingOption, "unitType" | "piecesPerUnit">): number {
  if (option.unitType === "adet") return 1;
  return option.piecesPerUnit && option.piecesPerUnit > 0 ? option.piecesPerUnit : 1;
}

/**
 * Sanity'de kutu/koli/palet fiyatları (ve toplu alım kademe fiyatları)
 * ADET BAŞI girilir — örn. "Koli (24 adet) — 41 ₺" = koli alınırsa adet
 * başı 41 ₺, yani 1 koli 984 ₺. Sitenin geri kalanı (sepet, ödeme,
 * WhatsApp, katalog, Google) birim fiyatıyla çalıştığı için, veri
 * Sanity'den okunduğu anda burada birim (koli) fiyatına çevrilir.
 */
export function normalizePricingOptions<T extends { pricingOptions?: PricingOption[] | null }>(
  product: T
): T {
  if (!product?.pricingOptions?.length) return product;
  return {
    ...product,
    pricingOptions: product.pricingOptions.map((option) => {
      const pieces = piecesInUnit(option);
      return {
        ...option,
        piecePrice: option.price,
        price: round2(option.price * pieces),
        bulkTiers: option.bulkTiers?.map((tier) => ({
          ...tier,
          price: round2(tier.price * pieces),
        })),
      };
    }),
  };
}
