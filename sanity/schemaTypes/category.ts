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
  ],
  preview: {
    select: { title: "title" },
  },
});
