import { defineField, defineType } from "sanity";

// İndirim kampanyası. Aktif ve tarih aralığındaki indirimler sitede
// otomatik uygulanır: ürün kartında ve ürün sayfasında eski fiyat üstü
// çizili, yeni fiyat yanında görünür; sepet, kartla ödeme ve WhatsApp
// mesajı da indirimli fiyatı kullanır. Bir ürüne birden fazla indirim
// uyuyorsa müşteri için en avantajlı olanı uygulanır (indirimler toplanmaz).
export const discountType = defineType({
  name: "discount",
  title: "İndirim",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "İndirim Adı",
      description: "Örn. 'Kasım İndirimi'. Ürün kartındaki rozette gösterilmez, sizin takibiniz için.",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "active",
      title: "Aktif",
      description: "Kapatırsanız indirim hemen sitede uygulanmayı bırakır.",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "scope",
      title: "Nereye Uygulanacak?",
      type: "string",
      options: {
        list: [
          { title: "Tüm ürünler", value: "all" },
          { title: "Seçili kategoriler", value: "categories" },
          { title: "Seçili ürünler", value: "products" },
        ],
        layout: "radio",
      },
      initialValue: "all",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Kategoriler",
      description:
        "Bir ana kategori seçerseniz alt kategorilerindeki ürünlere de uygulanır.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      hidden: ({ document }) => document?.scope !== "categories",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const scope = (context.document as { scope?: string } | undefined)?.scope;
          if (scope === "categories" && (!Array.isArray(value) || value.length === 0)) {
            return "En az bir kategori seçin.";
          }
          return true;
        }),
    }),
    defineField({
      name: "products",
      title: "Ürünler",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      hidden: ({ document }) => document?.scope !== "products",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const scope = (context.document as { scope?: string } | undefined)?.scope;
          if (scope === "products" && (!Array.isArray(value) || value.length === 0)) {
            return "En az bir ürün seçin.";
          }
          return true;
        }),
    }),
    defineField({
      name: "discountType",
      title: "İndirim Türü",
      type: "string",
      options: {
        list: [
          { title: "Yüzde (%)", value: "percent" },
          { title: "Tutar (₺, adet başı, KDV hariç)", value: "amount" },
        ],
        layout: "radio",
      },
      initialValue: "percent",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      title: "İndirim Değeri",
      description:
        "Yüzde seçildiyse örn. 10 → %10 indirim. Tutar seçildiyse örn. 5 → " +
        "her ADET'in KDV hariç fiyatından 5 ₺ düşülür (kolide 24 adet varsa " +
        "koli fiyatı 120 ₺ düşer). Toplu alım kademe fiyatlarına da uygulanır. " +
        "Tutar, ürünün adet fiyatına eşit veya büyükse o ürüne uygulanmaz.",
      type: "number",
      validation: (Rule) =>
        Rule.required()
          .positive()
          .custom((value, context) => {
            const type = (context.document as { discountType?: string } | undefined)
              ?.discountType;
            if (type === "percent" && typeof value === "number" && value >= 100) {
              return "Yüzde indirim 100'den küçük olmalı.";
            }
            return true;
          }),
    }),
    defineField({
      name: "startsAt",
      title: "Başlangıç (opsiyonel)",
      description: "Boş bırakılırsa hemen başlar.",
      type: "datetime",
    }),
    defineField({
      name: "endsAt",
      title: "Bitiş (opsiyonel)",
      description: "Boş bırakılırsa siz kapatana kadar sürer.",
      type: "datetime",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const startsAt = (context.document as { startsAt?: string } | undefined)?.startsAt;
          if (value && startsAt && new Date(value) <= new Date(startsAt)) {
            return "Bitiş, başlangıçtan sonra olmalı.";
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: {
      title: "title",
      active: "active",
      scope: "scope",
      discountType: "discountType",
      value: "value",
      endsAt: "endsAt",
    },
    prepare({ title, active, scope, discountType, value, endsAt }) {
      const amount = discountType === "percent" ? `%${value ?? "?"}` : `${value ?? "?"} ₺/adet`;
      const scopeLabel =
        { all: "Tüm ürünler", categories: "Seçili kategoriler", products: "Seçili ürünler" }[
          scope as string
        ] ?? "";
      const ended = endsAt && new Date(endsAt) < new Date();
      return {
        title: `${active === false || ended ? "⏸ " : "🏷 "}${title ?? "İndirim"}`,
        subtitle: `${amount} · ${scopeLabel}${ended ? " · süresi doldu" : active === false ? " · kapalı" : ""}`,
      };
    },
  },
});
