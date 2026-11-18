import { defineField, defineType } from "sanity";

// Site üyeleri. Kayıtlar siteden (kayıt formu / Google ile giriş) oluşur;
// Studio'da yalnızca görüntülenir. Şifre özeti ve tek kullanımlık kodlar
// Studio'da gizlidir. Belge kimlikleri "customer." ile başlar: Sanity'de
// noktalı kimlikler yalnızca yetkili (token'lı) isteklerle okunabilir —
// veri seti gizli olsa da ek bir güvenlik katmanı.
export const customerType = defineType({
  name: "customer",
  title: "Üye",
  type: "document",
  readOnly: true,
  fields: [
    defineField({ name: "name", title: "Ad Soyad", type: "string" }),
    defineField({ name: "email", title: "E-posta", type: "string" }),
    defineField({
      name: "emailVerified",
      title: "E-posta Doğrulandı",
      description: "Boşsa üye e-postasını henüz doğrulamadı ve şifreyle giriş yapamaz.",
      type: "datetime",
    }),
    defineField({
      name: "authProviders",
      title: "Giriş Yöntemleri",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "E-posta + şifre", value: "password" },
          { title: "Google", value: "google" },
        ],
      },
    }),
    defineField({ name: "phone", title: "Telefon", type: "string" }),
    defineField({ name: "city", title: "İl", type: "string" }),
    defineField({ name: "district", title: "İlçe", type: "string" }),
    defineField({ name: "address", title: "Adres", type: "text", rows: 2 }),
    defineField({ name: "taxNumber", title: "VKN / TCKN", type: "string" }),
    defineField({ name: "kvkkAcceptedAt", title: "KVKK Onayı", type: "datetime" }),
    defineField({ name: "lastLoginAt", title: "Son Giriş", type: "datetime" }),

    // --- Gizli sistem alanları ---
    defineField({ name: "passwordHash", type: "string", hidden: true }),
    defineField({ name: "googleId", type: "string", hidden: true }),
    defineField({ name: "verifyTokenHash", type: "string", hidden: true }),
    defineField({ name: "verifyTokenExpires", type: "datetime", hidden: true }),
    defineField({ name: "resetTokenHash", type: "string", hidden: true }),
    defineField({ name: "resetTokenExpires", type: "datetime", hidden: true }),
    defineField({ name: "failedLoginCount", type: "number", hidden: true }),
    defineField({ name: "lockedUntil", type: "datetime", hidden: true }),
  ],
  orderings: [
    { title: "En Yeni", name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] },
  ],
  preview: {
    select: { name: "name", email: "email", verified: "emailVerified", providers: "authProviders" },
    prepare({ name, email, verified, providers }) {
      const via = Array.isArray(providers) && providers.includes("google") ? " · Google" : "";
      return {
        title: name || email || "Üye",
        subtitle: `${email ?? ""}${verified ? "" : " · doğrulanmadı"}${via}`,
      };
    },
  },
});
