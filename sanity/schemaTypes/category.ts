import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Kategori",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Kategori Adı",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "parent",
      title: "Üst Kategori",
      description:
        "Bu bir ALT kategoriyse bağlı olduğu ana kategoriyi seçin (örn. " +
        "'Yapı Kimyasalları' altında 'Silikon ve Mastikler'). Ana kategori " +
        "ise boş bırakın. Ana kategori sayfasında alt kategorilerin " +
        "ürünleri de listelenir.",
      type: "reference",
      to: [{ type: "category" }],
      options: {
        // Yalnızca ana kategoriler seçilebilir (tek seviye alt kategori) ve
        // kategori kendisini üst kategori seçemez.
        filter: ({ document }) => ({
          filter: "!defined(parent) && _id != $id && _id != $draftId",
          params: {
            id: (document._id ?? "").replace(/^drafts\./, ""),
            draftId: `drafts.${(document._id ?? "").replace(/^drafts\./, "")}`,
          },
        }),
      },
    }),
    defineField({
      name: "order",
      title: "Sıralama",
      description: "Menüde soldan sağa görünüş sırası (küçük sayı önce gelir)",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "description",
      title: "Açıklama (SEO)",
      description:
        "Bu kategorinin kendi sayfasında (/kategori/...) başlığın altında " +
        "gösterilir, ayrıca Google'da bu sayfanın arama sonucu açıklaması " +
        "olarak kullanılır. 1-2 cümle yeterli.",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title", parentTitle: "parent.title" },
    prepare({ title, parentTitle }) {
      return {
        title: parentTitle ? `${parentTitle} › ${title}` : title,
        subtitle: parentTitle ? "Alt kategori" : "Ana kategori",
      };
    },
  },
  orderings: [
    {
      title: "Sıralama",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
