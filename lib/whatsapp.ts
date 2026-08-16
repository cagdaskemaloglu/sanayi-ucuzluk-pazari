import { UNIT_LABELS, formatPrice, getEffectiveUnitPrice } from "./pricing";
import type { CartItem } from "./cart/types";

interface BuildMessageParams {
  items: CartItem[];
  customerName?: string;
  customerNote?: string;
  siteUrl: string;
}

export function buildWhatsappMessage({
  items,
  customerName,
  customerNote,
  siteUrl,
}: BuildMessageParams): string {
  const lines: string[] = [];

  lines.push("Merhaba, aşağıdaki ürünler için sipariş/teklif talebim var:");
  lines.push("");

  let total = 0;

  items.forEach((item) => {
    const unitLabel = UNIT_LABELS[item.unitType] ?? item.unitType;
    const pieces = item.piecesPerUnit ? ` (${item.piecesPerUnit} adet)` : "";
    const productUrl = `${siteUrl}/urun/${item.productSlug}`;
    const unitPrice = getEffectiveUnitPrice(
      item.price,
      item.quantity,
      item.bulkTiers
    );
    const lineTotal = unitPrice * item.quantity;
    total += lineTotal;

    const discountNote =
      unitPrice < item.price ? " (toplu alım indirimli)" : "";

    lines.push(
      `• ${item.productName} — ${unitLabel}${pieces} x ${item.quantity} = ${formatPrice(
        lineTotal
      )}${discountNote}`
    );
    lines.push(`  ${productUrl}`);
  });

  lines.push("");
  lines.push(`Toplam: ${formatPrice(total)}`);

  if (customerName?.trim()) {
    lines.push("");
    lines.push(`Ad Soyad: ${customerName.trim()}`);
  }

  if (customerNote?.trim()) {
    lines.push(`Not: ${customerNote.trim()}`);
  }

  return lines.join("\n");
}

export function buildWhatsappUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
