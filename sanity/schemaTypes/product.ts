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
      name: "pricingOptions",
      title: "Satış Birimleri ve Fiyatları",
      description:
        "Bu ürün hangi birimlerle satılıyorsa ekleyin. Adet dışındaki birimlerde (kutu/koli/palet) kaç adet içerdiğini girin.",
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
              title: "Fiyat (₺)",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
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
              const pieces = piecesPerUnit ? ` (${piecesPerUnit} adet)` : "";
              return {
                title: `${unitLabel}${pieces} — ${price ?? "?"} ₺`,
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
