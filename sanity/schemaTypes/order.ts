import { defineField, defineType } from "sanity";

export const orderType = defineType({
  name: "order",
  title: "Sipariş",
  type: "document",
  fields: [
    defineField({
      name: "orderNumber",
      title: "Sipariş No",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Durum",
      type: "string",
      options: {
        list: [
          { title: "Beklemede", value: "pending" },
          { title: "Ödendi", value: "paid" },
          { title: "Başarısız / İptal", value: "failed" },
        ],
      },
      initialValue: "pending",
    }),
    defineField({
      name: "customerName",
      title: "Ad",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerSurname",
      title: "Soyad",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerEmail",
      title: "E-posta",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerPhone",
      title: "Telefon",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerCity",
      title: "Şehir",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerAddress",
      title: "Adres",
      type: "text",
      rows: 2,
      readOnly: true,
    }),
    defineField({
      name: "items",
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
      title: "Toplam (KDV Hariç)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "totalVat",
      title: "Toplam KDV",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "totalIncludingVat",
      title: "Toplam (KDV Dahil)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "paidTotal",
      title: "Tahsil Edilen Tutar (₺)",
      description:
        "PayTR'ın bildirdiği tahsilat tutarı. Taksitli ödemelerde vade farkı nedeniyle sipariş tutarından yüksek olabilir.",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "paymentFailureReason",
      title: "Başarısızlık Nedeni",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "paidAt",
      title: "Ödeme Tarihi",
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
      total: "totalIncludingVat",
      name: "customerName",
      surname: "customerSurname",
    },
    prepare({ orderNumber, status, total, name, surname }) {
      const statusLabel =
        { pending: "Beklemede", paid: "Ödendi", failed: "Başarısız" }[
          status as string
        ] ?? status;
      return {
        title: `${orderNumber ?? "?"} — ${name ?? ""} ${surname ?? ""}`.trim(),
        subtitle: `${statusLabel} — ${total ?? 0} ₺`,
      };
    },
  },
});
