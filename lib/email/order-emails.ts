import { SITE_CONFIG } from "@/lib/constants";
import { formatPrice } from "@/lib/pricing";
import { sendEmail, type SendEmailResult } from "./resend";

// Ödeme onaylanınca (PayTR bildirimi) gönderilen iki e-posta:
//  1) İşletmeye: yeni sipariş bildirimi (müşteri + teslimat + ürünler)
//  2) Müşteriye: sipariş onayı
//
// İşletmenin bildirim adresi: ORDER_NOTIFICATION_EMAIL env değişkeni
// (virgülle birden fazla adres yazılabilir); boşsa Sanity Site Ayarları'ndaki
// e-posta kullanılır.

export interface PaidOrderForEmail {
  orderNumber: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  items: {
    productName: string;
    unitLabel: string;
    quantity: number;
    lineTotal: number;
  }[];
  totalIncludingVat: number;
  shippingFee?: number;
  grandTotal?: number;
  paidTotal: number;
}

export interface ShopInfo {
  name: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
}

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function itemsTableHtml(order: PaidOrderForEmail): string {
  const shippingFee = order.shippingFee ?? 0;
  const grandTotal = order.grandTotal ?? order.totalIncludingVat;
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(item.productName)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap">${escapeHtml(item.unitLabel)} × ${escapeHtml(item.quantity)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${escapeHtml(formatPrice(item.lineTotal))}</td>
        </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:6px 8px;text-align:left">Ürün</th>
          <th style="padding:6px 8px;text-align:left">Miktar</th>
          <th style="padding:6px 8px;text-align:right">Tutar (KDV dahil)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:6px 8px;text-align:right">Ürünler</td>
          <td style="padding:6px 8px;text-align:right">${escapeHtml(formatPrice(order.totalIncludingVat))}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:6px 8px;text-align:right">Kargo</td>
          <td style="padding:6px 8px;text-align:right">${shippingFee > 0 ? escapeHtml(formatPrice(shippingFee)) : "Ücretsiz"}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:6px 8px;text-align:right;font-weight:bold">Toplam</td>
          <td style="padding:6px 8px;text-align:right;font-weight:bold">${escapeHtml(formatPrice(grandTotal))}</td>
        </tr>
      </tfoot>
    </table>`;
}

function itemsText(order: PaidOrderForEmail): string {
  const shippingFee = order.shippingFee ?? 0;
  const grandTotal = order.grandTotal ?? order.totalIncludingVat;
  return [
    ...order.items.map(
      (item) =>
        `- ${item.productName} (${item.unitLabel} x ${item.quantity}): ${formatPrice(item.lineTotal)}`
    ),
    `Ürünler: ${formatPrice(order.totalIncludingVat)}`,
    `Kargo: ${shippingFee > 0 ? formatPrice(shippingFee) : "Ücretsiz"}`,
    `Toplam: ${formatPrice(grandTotal)}`,
  ].join("\n");
}

function wrap(title: string, body: string): string {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
    <div style="max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#ffffff;border-radius:8px;padding:24px">
        <h1 style="margin:0 0 16px;font-size:20px;color:#1e3a5f">${escapeHtml(title)}</h1>
        ${body}
      </div>
    </div>
  </body></html>`;
}

export async function sendShopOrderNotification(
  order: PaidOrderForEmail,
  shop: ShopInfo
): Promise<SendEmailResult> {
  const recipients = (process.env.ORDER_NOTIFICATION_EMAIL || shop.email || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  const fullName = `${order.customerName} ${order.customerSurname}`;
  const studioUrl = `${SITE_CONFIG.url}/studio`;

  const html = wrap(
    `Yeni sipariş: ${order.orderNumber}`,
    `
    <p style="margin:0 0 16px">Online ödemesi alınan yeni bir sipariş var. Tahsil edilen tutar: <strong>${escapeHtml(formatPrice(order.paidTotal))}</strong></p>
    <h2 style="font-size:15px;margin:16px 0 8px">Müşteri</h2>
    <p style="margin:0;line-height:1.6">
      ${escapeHtml(fullName)}<br>
      Telefon: <a href="tel:${escapeHtml(order.customerPhone)}">${escapeHtml(order.customerPhone)}</a><br>
      E-posta: <a href="mailto:${escapeHtml(order.customerEmail)}">${escapeHtml(order.customerEmail)}</a>
    </p>
    <h2 style="font-size:15px;margin:16px 0 8px">Teslimat Adresi</h2>
    <p style="margin:0;line-height:1.6;white-space:pre-line">${escapeHtml(order.customerAddress)}<br>${escapeHtml(order.customerCity)}</p>
    <h2 style="font-size:15px;margin:16px 0 8px">Ürünler</h2>
    ${itemsTableHtml(order)}
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280">Siparişin detayları Sanity Studio → Sipariş bölümünde: <a href="${escapeHtml(studioUrl)}">${escapeHtml(studioUrl)}</a></p>
    `
  );

  const text = [
    `Yeni sipariş: ${order.orderNumber}`,
    `Tahsil edilen: ${formatPrice(order.paidTotal)}`,
    "",
    `Müşteri: ${fullName}`,
    `Telefon: ${order.customerPhone}`,
    `E-posta: ${order.customerEmail}`,
    `Adres: ${order.customerAddress}, ${order.customerCity}`,
    "",
    itemsText(order),
    "",
    `Studio: ${studioUrl}`,
  ].join("\n");

  return sendEmail({
    to: recipients,
    subject: `Yeni sipariş ${order.orderNumber} — ${formatPrice(order.paidTotal)} — ${fullName}`,
    html,
    text,
    replyTo: order.customerEmail,
  });
}

export async function sendCustomerOrderConfirmation(
  order: PaidOrderForEmail,
  shop: ShopInfo
): Promise<SendEmailResult> {
  const contactLines = [
    shop.phone ? `Telefon: ${shop.phone}` : "",
    shop.whatsappNumber ? `WhatsApp: https://wa.me/${shop.whatsappNumber}` : "",
    shop.email ? `E-posta: ${shop.email}` : "",
  ].filter(Boolean);

  const html = wrap(
    "Siparişiniz alındı",
    `
    <p style="margin:0 0 12px">Merhaba ${escapeHtml(order.customerName)},</p>
    <p style="margin:0 0 16px">Ödemeniz başarıyla alındı, teşekkür ederiz. Siparişiniz hazırlanıyor; kargoya verildiğinde sizi bilgilendireceğiz.</p>
    <p style="margin:0 0 16px"><strong>Sipariş No:</strong> ${escapeHtml(order.orderNumber)}</p>
    ${itemsTableHtml(order)}
    <h2 style="font-size:15px;margin:20px 0 8px">Teslimat Adresi</h2>
    <p style="margin:0;line-height:1.6;white-space:pre-line">${escapeHtml(order.customerAddress)}<br>${escapeHtml(order.customerCity)}</p>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6">
      Sorularınız için bize ulaşabilirsiniz:<br>
      ${contactLines.map((line) => escapeHtml(line)).join("<br>")}<br>
      İade ve kargo koşulları: <a href="${escapeHtml(`${SITE_CONFIG.url}/iade-ve-kargo`)}">${escapeHtml(`${SITE_CONFIG.url}/iade-ve-kargo`)}</a>
    </p>
    `
  );

  const text = [
    `Merhaba ${order.customerName},`,
    "",
    "Ödemeniz başarıyla alındı, teşekkür ederiz. Siparişiniz hazırlanıyor; kargoya verildiğinde sizi bilgilendireceğiz.",
    "",
    `Sipariş No: ${order.orderNumber}`,
    itemsText(order),
    "",
    `Teslimat adresi: ${order.customerAddress}, ${order.customerCity}`,
    "",
    ...contactLines,
    `İade ve kargo koşulları: ${SITE_CONFIG.url}/iade-ve-kargo`,
  ].join("\n");

  return sendEmail({
    to: [order.customerEmail],
    subject: `${shop.name} — Siparişiniz alındı (${order.orderNumber})`,
    html,
    text,
    replyTo: shop.email,
  });
}

// ---------------------------------------------------------------------------
// Durum e-postaları — mağaza sahibi Studio'da siparişin durumunu
// değiştirdiğinde (Sanity webhook → /api/siparis/durum) müşteriye gider.
// ---------------------------------------------------------------------------

export interface OrderForStatusEmail extends Omit<PaidOrderForEmail, "paidTotal"> {
  paidTotal?: number;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  statusNote?: string;
}

const STATUS_EMAIL_CONTENT: Record<
  "preparing" | "shipped" | "delivered" | "cancelled",
  { subject: string; title: string; intro: string }
> = {
  preparing: {
    subject: "Siparişiniz hazırlanıyor",
    title: "Siparişiniz hazırlanıyor",
    intro:
      "Siparişiniz hazırlanmaya başlandı. Kargoya verildiğinde takip bilgileriyle birlikte size tekrar haber vereceğiz.",
  },
  shipped: {
    subject: "Siparişiniz kargoya verildi",
    title: "Siparişiniz kargoya verildi",
    intro: "Siparişiniz kargoya verildi. Kargo bilgileriniz aşağıdadır.",
  },
  delivered: {
    subject: "Siparişiniz teslim edildi",
    title: "Siparişiniz teslim edildi",
    intro:
      "Siparişiniz teslim edildi olarak işaretlendi. Bizi tercih ettiğiniz için teşekkür ederiz. Bir sorun varsa lütfen bize ulaşın.",
  },
  cancelled: {
    subject: "Siparişiniz iptal edildi",
    title: "Siparişiniz iptal edildi",
    intro:
      "Siparişiniz iptal edildi. Online ödeme yaptıysanız ücret iadeniz, ödemeyi yaptığınız karta bankanıza bağlı olarak birkaç iş günü içinde yansır.",
  },
};

export function isCustomerStatusEmail(
  status: string
): status is keyof typeof STATUS_EMAIL_CONTENT {
  return status in STATUS_EMAIL_CONTENT;
}

function safeHttpUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function sendCustomerStatusEmail(
  order: OrderForStatusEmail,
  status: keyof typeof STATUS_EMAIL_CONTENT,
  shop: ShopInfo
): Promise<SendEmailResult> {
  const content = STATUS_EMAIL_CONTENT[status];
  const trackingUrl = safeHttpUrl(order.trackingUrl);
  const showShipping = status === "shipped";

  const contactLines = [
    shop.phone ? `Telefon: ${shop.phone}` : "",
    shop.whatsappNumber ? `WhatsApp: https://wa.me/${shop.whatsappNumber}` : "",
    shop.email ? `E-posta: ${shop.email}` : "",
  ].filter(Boolean);

  const shippingHtml = showShipping
    ? `
    <div style="margin:16px 0;padding:12px 16px;background:#f5f7fa;border-radius:6px;line-height:1.7">
      ${order.carrier ? `<strong>Kargo firması:</strong> ${escapeHtml(order.carrier)}<br>` : ""}
      ${order.trackingNumber ? `<strong>Takip numarası:</strong> ${escapeHtml(order.trackingNumber)}` : ""}
      ${trackingUrl ? `<div style="margin-top:12px"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:bold">Kargomu Takip Et</a></div>` : ""}
    </div>`
    : "";

  const noteHtml = order.statusNote?.trim()
    ? `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid #e8a33d;background:#fffaf0;white-space:pre-line">${escapeHtml(order.statusNote.trim())}</p>`
    : "";

  const html = wrap(
    content.title,
    `
    <p style="margin:0 0 12px">Merhaba ${escapeHtml(order.customerName)},</p>
    <p style="margin:0 0 16px">${escapeHtml(content.intro)}</p>
    <p style="margin:0 0 16px"><strong>Sipariş No:</strong> ${escapeHtml(order.orderNumber)}</p>
    ${shippingHtml}
    ${noteHtml}
    ${itemsTableHtml(order as PaidOrderForEmail)}
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6">
      Sorularınız için bize ulaşabilirsiniz:<br>
      ${contactLines.map((line) => escapeHtml(line)).join("<br>")}
    </p>
    `
  );

  const text = [
    `Merhaba ${order.customerName},`,
    "",
    content.intro,
    "",
    `Sipariş No: ${order.orderNumber}`,
    ...(showShipping
      ? [
          order.carrier ? `Kargo firması: ${order.carrier}` : "",
          order.trackingNumber ? `Takip numarası: ${order.trackingNumber}` : "",
          trackingUrl ? `Takip linki: ${trackingUrl}` : "",
        ].filter(Boolean)
      : []),
    ...(order.statusNote?.trim() ? ["", order.statusNote.trim()] : []),
    "",
    itemsText(order as PaidOrderForEmail),
    "",
    ...contactLines,
  ].join("\n");

  return sendEmail({
    to: [order.customerEmail],
    subject: `${shop.name} — ${content.subject} (${order.orderNumber})`,
    html,
    text,
    replyTo: shop.email,
  });
}
