import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Ayarları",
  type: "document",
  // Bu doküman tek bir kayıt olarak tutulacak (singleton).
  // Studio yapılandırmasında (structure.ts) tekil giriş olarak sunulacak.
  fields: [
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp Numarası",
      description:
        "Ülke kodu ile birlikte, boşluksuz ve + işaretsiz girin. Örn: 905551234567",
      type: "string",
      validation: (Rule) =>
        Rule.required().regex(/^\d{10,15}$/, {
          name: "whatsappNumber",
          invert: false,
        }),
    }),
    defineField({
      name: "phone",
      title: "Telefon (görüntülenen)",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "E-posta",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Adres",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "googleMapsEmbedUrl",
      title: "Google Haritalar Embed Linki",
      description:
        "Google Haritalar'da işyerini bul → Paylaş → 'Bir harita katıştır' → " +
        "'HTML kodunu kopyala' içindeki src=\"...\" değerini buraya yapıştır. " +
        "Boş bırakılırsa, aşağıdaki adres metninden otomatik bir harita oluşturulur.",
      type: "url",
    }),
    defineField({
      name: "aboutTitle",
      title: "Hakkımızda Başlığı",
      type: "string",
      initialValue: "Hakkımızda",
    }),
    defineField({
      name: "aboutText",
      title: "Hakkımızda Metni",
      description: "Footer'ın hemen üzerinde gösterilecek kısa tanıtım metni.",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "aboutImages",
      title: "Hakkımızda Fotoğrafları",
      description:
        "Opsiyonel — işyeri, ekip veya ürün fotoğrafı ekleyebilirsiniz. " +
        "1 fotoğraf eklerseniz metnin yanında büyük görünür, birden fazla " +
        "eklerseniz küçük bir galeri olarak gösterilir.",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (Rule) => Rule.max(6),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Ayarları" };
    },
  },
});
