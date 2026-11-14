import { defineField, defineType } from "sanity";
import {
  CARRIERS,
  ORDER_STATUSES,
  orderStatusTitle,
} from "../../lib/orders/status";

export const orderType = defineType({
  name: "order",
  title: "Sipariş",
  type: "document",
  groups: [
    { name: "durum", title: "Durum ve Kargo", default: true },
    { name: "musteri", title: "Müşteri" },
    { name: "urunler", title: "Ürünler ve Tutar" },
    { name: "odeme", title: "Ödeme Kaydı" },
  ],
  fields: [
    defineField({
      name: "orderNumber",
      group: "durum",
      title: "Sipariş No",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Durum",
      description:
        "Durumu değiştirip PUBLISH'e bastığınızda müşteriye otomatik e-posta " +
        "gider (Hazırlanıyor, Kargolandı, Teslim Edildi, İptal / İade). " +
        "'Ödeme Bekleniyor', 'Yeni Sipariş' ve 'Ödeme Başarısız' durumlarını " +
        "ödeme sistemi kendisi yazar.",
      type: "string",
      group: "durum",
      options: {
        list: ORDER_STATUSES.map(({ value, title }) => ({ value, title })),
        layout: "radio",
      },
      initialValue: "pending",
    }),
    defineField({
      name: "carrier",
      title: "Kargo Firması",
      type: "string",
      group: "durum",
      options: { list: CARRIERS.map((name) => ({ title: name, value: name })) },
      hidden: ({ document }) =>
        !["shipped", "delivered"].includes(document?.status as string),
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const status = (context.document as { status?: string } | undefined)?.status;
          if (status === "shipped" && !value) {
            return "Kargolandı durumunda kargo firması seçilmeli (müşteriye e-postada gider).";
          }
          return true;
        }),
    }),
    defineField({
      name: "trackingNumber",
      title: "Kargo Takip Numarası",
      type: "string",
      group: "durum",
      hidden: ({ document }) =>
        !["shipped", "delivered"].includes(document?.status as string),
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as { status?: string; carrier?: string } | undefined;
          if (doc?.status === "shipped" && !value && doc?.carrier !== "Ambar / Nakliye") {
            return "Kargolandı durumunda takip numarası girilmeli (müşteriye e-postada gider).";
          }
          return true;
        }),
    }),
    defineField({
      name: "trackingUrl",
      title: "Kargo Takip Linki (opsiyonel)",
      description:
        "Kargo firmasının sitesindeki takip sayfasının linki. Girilirse " +
        "e-postada 'Kargomu Takip Et' butonu olarak gösterilir.",
      type: "url",
      group: "durum",
      hidden: ({ document }) =>
        !["shipped", "delivered"].includes(document?.status as string),
    }),
    defineField({
      name: "statusNote",
      title: "Müşteriye Not (opsiyonel)",
      description:
        "Bir sonraki durum e-postasına eklenir. Örn. 'Ürününüz yarın öğlene " +
        "kadar kargoya verilecek.' veya iptal nedeni.",
      type: "text",
      rows: 2,
      group: "durum",
    }),
    defineField({
      name: "statusEmails",
      title: "Gönderilen Durum E-postaları",
      description: "Sistem tarafından tutulur; her durum için e-posta bir kez gider.",
      type: "array",
      group: "durum",
      readOnly: true,
      of: [
        {
          type: "object",
          name: "statusEmail",
          fields: [
            defineField({ name: "status", title: "Durum", type: "string" }),
            defineField({ name: "result", title: "Sonuç", type: "string" }),
            defineField({ name: "at", title: "Zaman", type: "datetime" }),
            defineField({ name: "error", title: "Hata", type: "string" }),
            defineField({ name: "note", title: "Gönderilen Not", type: "text" }),
          ],
          preview: {
            select: { status: "status", result: "result", at: "at", error: "error" },
            prepare({ status, result, at, error }) {
              const resultLabel =
                {
                  sent: "gönderildi",
                  sending: "gönderiliyor…",
                  failed: "GÖNDERİLEMEDİ",
                  skipped: "atlandı (e-posta ayarı yok)",
                }[result as string] ?? result;
              return {
                title: `${orderStatusTitle(status)} — ${resultLabel}`,
                subtitle: [
                  at ? new Date(at).toLocaleString("tr-TR") : "",
                  error ?? "",
                ]
                  .filter(Boolean)
                  .join(" · "),
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "customerName",
      group: "musteri",
      title: "Ad",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerSurname",
      group: "musteri",
      title: "Soyad",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerEmail",
      group: "musteri",
      title: "E-posta",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerPhone",
      group: "musteri",
      title: "Telefon",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerCity",
      group: "musteri",
      title: "Şehir",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerAddress",
      group: "musteri",
      title: "Adres",
      type: "text",
      rows: 2,
      readOnly: true,
    }),
    defineField({
      name: "items",
      group: "urunler",
      title: "Ürünler",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          name: "orderItem",
          fields: [
            defineField({ name: "productName", title: "Ürün Adı", type: "string" }),
            defineField({ name: "unitLabel", title: "Birim", type: "string" }),
            defineField({ name: "quantity", title: "Miktar", type: "number" }),
            defineField({ name: "unitPrice", title: "Birim Fiyat (KDV Dahil)", type: "number" }),
            defineField({ name: "lineTotal", title: "Satır Toplamı", type: "number" }),
          ],
          preview: {
            select: { title: "productName", quantity: "quantity", price: "lineTotal" },
            prepare({ title, quantity, price }) {
              return { title: `${title} x${quantity} — ${price} ₺` };
            },
          },
        },
      ],
    }),
    defineField({
      name: "totalExcludingVat",
      group: "urunler",
      title: "Toplam (KDV Hariç)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "totalVat",
      group: "urunler",
      title: "Toplam KDV",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "totalIncludingVat",
      group: "urunler",
      title: "Ürünler Toplamı (KDV Dahil)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "shippingFee",
      group: "urunler",
      title: "Kargo Ücreti (₺, KDV Dahil)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "grandTotal",
      group: "urunler",
      title: "Ödenecek Toplam (Kargo Dahil)",
      description: "Müşteriden tahsil edilen tutar: ürünler + kargo.",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "paidTotal",
      group: "odeme",
      title: "Tahsil Edilen Tutar (₺)",
      description:
        "PayTR'ın bildirdiği tahsilat tutarı. Taksitli ödemelerde vade farkı nedeniyle sipariş tutarından yüksek olabilir.",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "paymentFailureReason",
      group: "odeme",
      title: "Başarısızlık Nedeni",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "paidAt",
      group: "odeme",
      title: "Ödeme Tarihi",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "notificationEmailSentAt",
      group: "odeme",
      title: "Sipariş Onay E-postaları Gönderildi",
      description:
        "Ödeme onayından sonra işletmeye ve müşteriye e-posta gönderildiği zaman.",
      type: "datetime",
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: "En Yeni",
      name: "createdDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      orderNumber: "orderNumber",
      status: "status",
      total: "grandTotal",
      productsTotal: "totalIncludingVat",
      name: "customerName",
      surname: "customerSurname",
    },
    prepare({ orderNumber, status, total, productsTotal, name, surname }) {
      return {
        title: `${name ?? ""} ${surname ?? ""} — ${total ?? productsTotal ?? 0} ₺`.trim(),
        subtitle: `${orderStatusTitle(status)} · ${orderNumber ?? "?"}`,
      };
    },
  },
});
