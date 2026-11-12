import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Ayarları",
  type: "document",
  // Bu doküman tek bir kayıt olarak tutulacak (singleton).
  // Studio yapılandırmasında (structure.ts) tekil giriş olarak sunulacak.
  fields: [
    defineField({
      name: "siteIcon",
      title: "Header İkonu",
      description:
        "Site başlığının yanında (header'da) gösterilecek küçük ikon/logo. " +
        "Kare bir görsel önerilir (örn. 64x64 veya 128x128 PNG). Boş " +
        "bırakılırsa ikon hiç gösterilmez, sadece site adı görünür.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "favicon",
      title: "Favicon (Tarayıcı Sekmesi İkonu)",
      description:
        "Tarayıcı sekmesinde görünen küçük ikon. Kare bir PNG önerilir " +
        "(örn. 32x32 veya 64x64). Boş bırakılırsa varsayılan ikon kullanılır.",
      type: "image",
    }),
    defineField({
      name: "siteTitle",
      title: "Site Başlığı",
      description:
        "Header'da ve tarayıcı sekmesi başlığında görünen isim. Boş " +
        `bırakılırsa varsayılan ("Sanayi Ucuzluk Pazarı") kullanılır.`,
      type: "string",
    }),
    defineField({
      name: "siteTitleColor",
      title: "Site Başlığı Rengi",
      description:
        "Hex renk kodu girin (örn. #FFFFFF). Boş bırakılırsa varsayılan " +
        "beyaz kullanılır.",
      type: "string",
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}){1,2}$/, {
          name: "hexRenk",
          invert: false,
        }).warning("Geçerli bir hex renk kodu girin, örn. #F5A623"),
    }),
    defineField({
      name: "siteDescription",
      title: "Site Açıklaması",
      description:
        "Arama motorlarında (Google) ve sosyal medya paylaşımlarında " +
        "görünen kısa açıklama metni. Boş bırakılırsa varsayılan açıklama " +
        "kullanılır.",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "siteDescriptionColor",
      title: "Site Açıklaması Rengi",
      description:
        "Header'da başlığın altında açıklama gösterilirse kullanılacak " +
        "hex renk kodu (örn. #E5E7EB). Opsiyonel.",
      type: "string",
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}){1,2}$/, {
          name: "hexRenk",
          invert: false,
        }).warning("Geçerli bir hex renk kodu girin, örn. #E5E7EB"),
    }),
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
      name: "catalogDownloadEnabled",
      title: "Katalog İndirme Butonu Aktif mi?",
      description:
        "Kapatırsan ana sayfadaki 'Katalog İndir' butonu hiç görünmez. " +
        "Boş bırakılırsa (varsayılan) buton görünür durumda kalır.",
      type: "boolean",
      initialValue: true,
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
    defineField({
      name: "instagramUrl",
      title: "Instagram Linki",
      description:
        "Tam Instagram profil linkin (örn. https://instagram.com/kullaniciadi). " +
        "Boş bırakılırsa header üstündeki çubukta Instagram ikonu görünmez.",
      type: "url",
    }),
    defineField({
      name: "shippingFee",
      title: "Kargo Ücreti (₺, KDV dahil)",
      description:
        "Online ödemede siparişe eklenen standart kargo ücreti. 0 " +
        "girerseniz kargo her zaman ücretsiz olur. Sepet, ödeme sayfası, " +
        "Google Alışveriş ve 'İade ve Kargo' sayfası bu değeri kullanır. " +
        "Boş bırakılırsa online ödemede kargo ücreti alınmaz ve Google'a " +
        "kargo bilgisi gönderilmez (bu durumda Merchant Center'dan ayrıca " +
        "tanımlamanız gerekir).",
      type: "number",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "freeShippingThreshold",
      title: "Ücretsiz Kargo Alt Limiti (₺, KDV dahil)",
      description:
        "Bu tutar ve üzerindeki siparişlerde kargo ücretsiz. Böyle bir " +
        "kampanya yoksa boş bırakın.",
      type: "number",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "deliveryMinDays",
      title: "Teslimat Süresi — En Az (iş günü)",
      description: "Kargoya verildikten sonra en erken kaç iş gününde teslim edilir.",
      type: "number",
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: "deliveryMaxDays",
      title: "Teslimat Süresi — En Fazla (iş günü)",
      type: "number",
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: "returnDays",
      title: "İade Süresi (gün)",
      description:
        "Teslimattan itibaren kaç gün içinde iade kabul edilir. Yasal " +
        "alt sınır 14 gündür; boş bırakılırsa 14 kabul edilir.",
      type: "number",
      initialValue: 14,
      validation: (Rule) => Rule.min(14).integer(),
    }),
    defineField({
      name: "freeReturns",
      title: "İade Kargosu Ücretsiz mi?",
      description:
        "İşaretlerseniz iadelerde kargo ücretini işletme karşılar. " +
        "İşaretlemezseniz iade kargo ücreti müşteriye aittir.",
      type: "boolean",
    }),
    defineField({
      name: "googleSiteVerification",
      title: "Google Search Console Doğrulama Kodu",
      description:
        "Google Search Console'da 'HTML etiketi' doğrulama yöntemini " +
        "seçtiğinde sana verilen content=\"...\" değerini buraya yapıştır " +
        "(sadece kod, <meta> etiketinin tamamını değil). DNS ile doğrulama " +
        "yapacaksan bu alana gerek yok.",
      type: "string",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Ayarları" };
    },
  },
});
