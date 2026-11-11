import {
  UNIT_LABELS,
  getEffectiveUnitPrice,
  getVatAmount,
} from "@/lib/pricing";
import type { ProductCheckoutData } from "@/lib/sanity/types";

// Ödeme tutarı ASLA tarayıcıdan alınmaz: tarayıcı sadece (ürün, birim, adet)
// gönderir, fiyat/KDV/kademe indirimi burada, Sanity'deki güncel veriyle
// sunucuda hesaplanır. Böylece istek değiştirilerek daha ucuza ödeme
// başlatılamaz.

export interface CheckoutItemInput {
  productId: string;
  unitType: string;
  quantity: number;
}

export interface CheckoutLine {
  productId: string;
  productName: string;
  unitLabel: string;
  quantity: number;
  /** KDV dahil birim fiyat (kayıt/gösterim için). */
  unitPriceIncludingVat: number;
  lineTotalExcludingVat: number;
  vatAmount: number;
  lineTotalIncludingVat: number;
}

export interface CheckoutTotals {
  totalExcludingVat: number;
  totalVat: number;
  totalIncludingVat: number;
}

export type ComputeCheckoutResult =
  | { ok: true; lines: CheckoutLine[]; totals: CheckoutTotals }
  | { ok: false; error: string };

const MAX_QUANTITY = 100_000;
const STALE_CART_ERROR =
  "Sepetinizdeki bir ürün artık satışta değil veya fiyatı değişti. Lütfen sepetinizi güncelleyip tekrar deneyin.";

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function computeCheckoutLines(
  items: CheckoutItemInput[],
  products: ProductCheckoutData[]
): ComputeCheckoutResult {
  const productById = new Map(products.map((product) => [product._id, product]));
  const lines: CheckoutLine[] = [];

  for (const item of items) {
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY
    ) {
      return { ok: false, error: "Geçersiz ürün miktarı." };
    }

    const product = productById.get(item.productId);
    const option = product?.pricingOptions?.find(
      (candidate) => candidate.unitType === item.unitType
    );

    if (!product || !option) {
      return { ok: false, error: STALE_CART_ERROR };
    }

    if (product.stockStatus === "out_of_stock") {
      return { ok: false, error: `"${product.name}" şu anda stokta yok.` };
    }

    const unitPrice = getEffectiveUnitPrice(
      option.price,
      item.quantity,
      option.bulkTiers
    );
    const lineTotalExcludingVat = round2(unitPrice * item.quantity);
    const vatAmount = round2(getVatAmount(lineTotalExcludingVat, product.vatRate));
    const lineTotalIncludingVat = round2(lineTotalExcludingVat + vatAmount);

    lines.push({
      productId: product._id,
      productName: product.name,
      unitLabel: UNIT_LABELS[item.unitType] ?? item.unitType,
      quantity: item.quantity,
      unitPriceIncludingVat: round2(lineTotalIncludingVat / item.quantity),
      lineTotalExcludingVat,
      vatAmount,
      lineTotalIncludingVat,
    });
  }

  const totals: CheckoutTotals = {
    totalExcludingVat: round2(
      lines.reduce((sum, line) => sum + line.lineTotalExcludingVat, 0)
    ),
    totalVat: round2(lines.reduce((sum, line) => sum + line.vatAmount, 0)),
    totalIncludingVat: round2(
      lines.reduce((sum, line) => sum + line.lineTotalIncludingVat, 0)
    ),
  };

  if (totals.totalIncludingVat <= 0) {
    return { ok: false, error: "Sepet tutarı geçersiz." };
  }

  return { ok: true, lines, totals };
}
