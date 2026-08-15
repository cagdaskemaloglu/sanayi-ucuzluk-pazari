import { UNIT_LABELS, formatPrice } from "./pricing";
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

  items.forEach((item) => {
    const unitLabel = UNIT_LABELS[item.unitType] ?? item.unitType;
    const pieces = item.piecesPerUnit ? ` (${item.piecesPerUnit} adet)` : "";
    const productUrl = `${siteUrl}/urun/${item.productSlug}`;
    lines.push(
      `• ${item.productName} — ${unitLabel}${pieces} x ${item.quantity} = ${formatPrice(
        item.price * item.quantity
      )}`
    );
    lines.push(`  ${productUrl}`);
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
