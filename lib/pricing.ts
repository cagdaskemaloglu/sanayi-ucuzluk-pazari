export const UNIT_LABELS: Record<string, string> = {
  adet: "Adet",
  kutu: "Kutu",
  koli: "Koli",
  palet: "Palet",
};

import type { PricingOption } from "@/lib/sanity/types";

// Satış birimlerinin sitede gösterim sırası: en küçükten büyüğe. İlk sıradaki
// birim (genelde Adet) ürün kartında ve ürün sayfasında varsayılan seçili
// gelir ve Google'a bildirilen temsili fiyat olur.
const UNIT_ORDER: Record<string, number> = { adet: 0, kutu: 1, koli: 2, palet: 3 };

export function sortPricingOptions<T extends Pick<PricingOption, "unitType">>(options: T[]): T[] {
  return [...options].sort(
    (a, b) => (UNIT_ORDER[a.unitType] ?? 99) - (UNIT_ORDER[b.unitType] ?? 99)
  );
}

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

/** Sitede uygulanan, aktif bir indirim kampanyası (Sanity "discount"). */
export interface ActiveDiscount {
  _id: string;
  title: string;
  scope: "all" | "categories" | "products";
  discountType: "percent" | "amount";
  value: number;
  categoryIds?: string[] | null;
  productIds?: string[] | null;
}

export interface AppliedDiscount {
  title: string;
  /** Rozet metni: "%10 İndirim" veya "5 ₺ İndirim". */
  label: string;
}

/** Adet başı KDV hariç fiyata indirimi uygular (0'ın altına inmez). */
export function applyDiscountToPiecePrice(piecePrice: number, discount: ActiveDiscount): number {
  const discounted =
    discount.discountType === "percent"
      ? piecePrice * (1 - discount.value / 100)
      : piecePrice - discount.value;
  return round2(Math.max(0, discounted));
}

type DiscountableProduct = {
  _id: string;
  pricingOptions?: PricingOption[] | null;
  category?: { _id?: string; parent?: { _id?: string } | null } | null;
};

function isDiscountApplicable(product: DiscountableProduct, discount: ActiveDiscount): boolean {
  if (!(discount.value > 0)) return false;
  if (discount.scope === "all") return true;
  if (discount.scope === "products") {
    return Boolean(discount.productIds?.includes(product._id));
  }
  if (discount.scope === "categories") {
    const ids = [product.category?._id, product.category?.parent?._id].filter(Boolean);
    return ids.some((id) => discount.categoryIds?.includes(id as string));
  }
  return false;
}

/**
 * Ürüne uyan indirimlerden müşteri için en avantajlı olanı seçer
 * (indirimler toplanmaz). Karşılaştırma ilk satış biriminin adet fiyatıyla.
 */
export function findBestDiscount(
  product: DiscountableProduct,
  discounts: ActiveDiscount[]
): ActiveDiscount | undefined {
  const basePrice = product.pricingOptions?.[0]?.price;
  if (basePrice === undefined) return undefined;
  let best: ActiveDiscount | undefined;
  let bestPrice = basePrice;
  for (const discount of discounts) {
    if (!isDiscountApplicable(product, discount)) continue;
    const price = applyDiscountToPiecePrice(basePrice, discount);
    // Fiyatı 0'a (veya altına) indiren indirim bu ürüne uygulanmaz —
    // yanlış girilmiş bir tutar ürünün bedavaya satılmasına yol açmasın.
    if (price <= 0) continue;
    if (price < bestPrice) {
      best = discount;
      bestPrice = price;
    }
  }
  return best;
}

export function discountLabel(discount: ActiveDiscount): string {
  return discount.discountType === "percent"
    ? `%${discount.value.toLocaleString("tr-TR")} İndirim`
    : `${discount.value.toLocaleString("tr-TR")} ₺ İndirim`;
}

/**
 * Sanity'den okunan ürün fiyatlarını sitenin kullandığı biçime çevirir:
 *
 * 1) Kutu/koli/palet fiyatları (ve toplu alım kademe fiyatları) Sanity'de
 *    ADET BAŞI girilir — örn. "Koli (24 adet) — 41 ₺" = 1 koli 984 ₺.
 *    Sitenin geri kalanı (sepet, ödeme, WhatsApp, katalog, Google) birim
 *    fiyatıyla çalıştığı için burada birim (koli) fiyatına çevrilir.
 * 2) Birimler Adet → Kutu → Koli → Palet sırasına dizilir (ilk birim
 *    kartta ve ürün sayfasında varsayılan seçili gelir).
 * 3) Aktif indirim varsa adet fiyatına uygulanır; eski fiyat
 *    originalPrice / originalPiecePrice olarak saklanır (üstü çizili
 *    gösterim için), price artık indirimli fiyattır.
 */
export function normalizePricingOptions<T extends DiscountableProduct>(
  product: T,
  discounts: ActiveDiscount[] = []
): T & { appliedDiscount?: AppliedDiscount } {
  if (!product?.pricingOptions?.length) return product;
  const sortedOptions = sortPricingOptions(product.pricingOptions);
  const discount = findBestDiscount({ ...product, pricingOptions: sortedOptions }, discounts);
  const discountPiece = (piecePrice: number) =>
    discount ? applyDiscountToPiecePrice(piecePrice, discount) : piecePrice;

  return {
    ...product,
    ...(discount
      ? { appliedDiscount: { title: discount.title, label: discountLabel(discount) } }
      : {}),
    pricingOptions: sortedOptions.map((option) => {
      const pieces = piecesInUnit(option);
      const piecePrice = discountPiece(option.price);
      return {
        ...option,
        piecePrice,
        price: round2(piecePrice * pieces),
        ...(discount
          ? {
              originalPiecePrice: option.price,
              originalPrice: round2(option.price * pieces),
            }
          : {}),
        bulkTiers: option.bulkTiers?.map((tier) => ({
          ...tier,
          price: round2(discountPiece(tier.price) * pieces),
        })),
      };
    }),
  };
}
