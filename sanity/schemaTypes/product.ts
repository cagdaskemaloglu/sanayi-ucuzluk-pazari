import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Ürün",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Ürün Adı",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategori",
      type: "reference",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "brand",
      title: "Marka",
      description:
        "Ürünün markası (örn. Bosch, Makita). Google Alışveriş'te " +
        "listelenmek için önerilir. Markasız ürünlerde boş bırakın.",
      type: "string",
    }),
    defineField({
      name: "sku",
      title: "Stok Kodu (SKU)",
      description: "İşletmenin kendi ürün/stok kodu. Opsiyonel.",
      type: "string",
    }),
    defineField({
      name: "gtin",
      title: "Barkod (EAN / GTIN)",
      description:
        "Ürün ambalajındaki 8, 12, 13 veya 14 haneli barkod numarası. " +
        "Google Alışveriş'te ürünün doğru eşleşmesi için çok önemlidir. " +
        "Barkodu olmayan ürünlerde boş bırakın.",
      type: "string",
      validation: (Rule) =>
        Rule.regex(/^(\d{8}|\d{12,14})$/, {
          name: "barkod",
          invert: false,
        }).warning("Barkod 8, 12, 13 veya 14 haneli olmalı, sadece rakam."),
    }),
    defineField({
      name: "mpn",
      title: "Üretici Parça Numarası (MPN)",
      description:
        "Üreticinin verdiği model/parça numarası. Barkod yoksa marka ile " +
        "birlikte girilirse Google ürünü tanımlayabilir. Opsiyonel.",
      type: "string",
    }),
    defineField({
      name: "mainImage",
      title: "Ana Fotoğraf",
      description: "Ürün kartında ve galeride ilk sırada gösterilir",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Ek Fotoğraflar",
      description: "Ürün sayfasındaki galeri için ek görseller (opsiyonel)",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "description",
      title: "Açıklama",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "featured",
      title: "Öne Çıkan Ürün",
      description:
        "İşaretlenirse bu ürün ana sayfadaki 'Öne Çıkan Ürünler' " +
        "bölümünde gösterilir.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "stockStatus",
      title: "Stok Durumu",
      type: "string",
      options: {
        list: [
          { title: "Stokta Var", value: "in_stock" },
          { title: "Stokta Yok / Tükendi", value: "out_of_stock" },
        ],
        layout: "radio",
      },
      initialValue: "in_stock",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "vatRate",
      title: "KDV Oranı (%)",
      description:
        "Aşağıda gireceğiniz tüm fiyatlar KDV HARİÇ olmalıdır. Bu ürüne " +
        "uygulanacak KDV yüzdesini girin (örn. 20 veya 10 veya 1).",
      type: "number",
      initialValue: 20,
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: "pricingOptions",
      title: "Satış Birimleri ve Fiyatları (KDV Hariç, Adet Başı)",
      description:
        "Bu ürün hangi birimlerle satılıyorsa ekleyin. Fiyatları KDV " +
        "HARİÇ ve her zaman ADET BAŞI girin. Örn. kolide 24 adet var ve " +
        "koli alana adet başı 41 ₺ ise: Birim = Koli, Adet Sayısı = 24, " +
        "Fiyat = 41 → sitede koli fiyatı otomatik 984 ₺ olur.",
      type: "array",
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: "object",
          name: "pricingOption",
          title: "Satış Birimi",
          fields: [
            defineField({
              name: "unitType",
              title: "Birim",
              type: "string",
              options: {
                list: [
                  { title: "Adet", value: "adet" },
                  { title: "Kutu", value: "kutu" },
                  { title: "Koli", value: "koli" },
                  { title: "Palet", value: "palet" },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "piecesPerUnit",
              title: "Bu Birimdeki Adet Sayısı",
              description:
                "Örn. Koli seçiliyse ve koli içinde 30 adet varsa 30 girin. Adet birimi için boş bırakılabilir.",
              type: "number",
              validation: (Rule) => Rule.min(1),
              hidden: ({ parent }) => parent?.unitType === "adet",
            }),
            defineField({
              name: "price",
              title: "Adet Başı Fiyat (₺, KDV hariç)",
              description:
                "Kutu/koli/palet seçiliyse bile TEK ADEDİN fiyatını girin; " +
                "birim fiyatı, adet sayısıyla çarpılarak hesaplanır.",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: "bulkTiers",
              title: "Toplu Alım Kademeleri (opsiyonel)",
              description:
                "Belirli bir miktarın üzerinde alımlarda birim fiyatı " +
                "düşürmek için ekleyin. Örn: '10 ve üzeri: 140₺'. Miktar " +
                "eşiğine ulaşan en yüksek kademe otomatik uygulanır.",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "bulkTier",
                  title: "Kademe",
                  fields: [
                    defineField({
                      name: "minQuantity",
                      title: "Minimum Miktar",
                      description:
                        "Bu birimden (adet/kutu/koli/palet) bu miktar ve " +
                        "üzerinde alınırsa geçerli olur.",
                      type: "number",
                      validation: (Rule) => Rule.required().min(2),
                    }),
                    defineField({
                      name: "price",
                      title: "Bu Kademedeki Adet Başı Fiyat (₺)",
                      type: "number",
                      validation: (Rule) => Rule.required().min(0),
                    }),
                  ],
                  preview: {
                    select: { minQuantity: "minQuantity", price: "price" },
                    prepare({ minQuantity, price }) {
                      return {
                        title: `${minQuantity}+ birim: adet başı ${price} ₺`,
                      };
                    },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: {
              unitType: "unitType",
              price: "price",
              piecesPerUnit: "piecesPerUnit",
            },
            prepare({ unitType, price, piecesPerUnit }) {
              const unitLabel =
                { adet: "Adet", kutu: "Kutu", koli: "Koli", palet: "Palet" }[
                  unitType as string
                ] ?? unitType;
              const pieceCount =
                unitType !== "adet" && piecesPerUnit ? piecesPerUnit : 1;
              const pieces = pieceCount > 1 ? ` (${pieceCount} adet)` : "";
              const unitTotal =
                pieceCount > 1 && typeof price === "number"
                  ? ` → ${unitLabel.toLocaleLowerCase("tr-TR")} ${Math.round(price * pieceCount * 100) / 100} ₺`
                  : "";
              return {
                title: `${unitLabel}${pieces} — adet başı ${price ?? "?"} ₺${unitTotal}`,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "mainImage",
      subtitle: "category.title",
    },
  },
});
