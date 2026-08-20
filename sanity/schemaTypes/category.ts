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
    select: { title: "title" },
  },
});
