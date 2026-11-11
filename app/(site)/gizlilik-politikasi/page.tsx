import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/features/legal/legal-page-layout";
import { LegalSection } from "@/components/features/legal/legal-section";
import { getBusinessContact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  alternates: { canonical: "/gizlilik-politikasi" },
};

export default async function GizlilikPolitikasiPage() {
  const contact = await getBusinessContact();

  return (
    <LegalPageLayout title="Gizlilik Politikası">
      <LegalSection title="1. Genel Bilgilendirme">
        <p>
          Bu Gizlilik Politikası, {contact.name} internet sitesini
          (&quot;Site&quot;) ziyaret ettiğinizde veya sepet/sipariş
          özelliklerini kullandığınızda hangi bilgilerin nasıl
          toplandığını ve kullanıldığını açıklamak amacıyla
          hazırlanmıştır.
        </p>
      </LegalSection>

      <LegalSection title="2. Toplanan Bilgiler">
        <p>
          Site&apos;yi gezinirken herhangi bir kayıt/üyelik işlemi
          gerektirmez. Sepete ürün eklediğinizde, ürün ve miktar bilgileri
          tarayıcınızın yerel deposunda (localStorage) sadece cihazınızda
          saklanır; bu bilgiler sunucularımıza otomatik olarak
          gönderilmez. WhatsApp&apos;a gönder butonuna tıkladığınızda,
          o anda girdiğiniz ad-soyad (isteğe bağlı) ve mesaj bilgisi
          WhatsApp üzerinden tarafımıza iletilir.
        </p>
      </LegalSection>

      <LegalSection title="3. Bilgilerin Kullanım Amacı">
        <p>
          Toplanan bilgiler yalnızca sipariş/teklif taleplerinizin
          değerlendirilmesi ve sizinle iletişime geçilmesi amacıyla
          kullanılır; pazarlama amaçlı üçüncü taraflarla paylaşılmaz.
        </p>
      </LegalSection>

      <LegalSection title="4. Çerezler (Cookies) ve Yerel Depolama">
        <p>
          Site şu an takip amaçlı çerez kullanmamaktadır. Sepet
          içeriğinizin tarayıcınızda hatırlanabilmesi için yalnızca
          tarayıcının yerel depolama (localStorage) özelliği
          kullanılmaktadır; bu veri cihazınızdan çıkmaz ve istediğiniz
          zaman tarayıcı ayarlarından temizlenebilir. İleride site
          performansını ölçmek amacıyla analiz araçları (örn. Google
          Analytics) eklenmesi halinde bu politika güncellenecektir.
        </p>
      </LegalSection>

      <LegalSection title="5. Üçüncü Taraf Hizmet Sağlayıcılar">
        <p>Site&apos;nin çalışması için aşağıdaki hizmet sağlayıcılardan faydalanılmaktadır:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">Vercel</span> — sitenin barındırılması (hosting)
          </li>
          <li>
            <span className="font-medium">Cloudflare</span> — DNS, güvenlik ve performans
          </li>
          <li>
            <span className="font-medium">Sanity</span> — ürün/kategori içerik yönetimi
          </li>
          <li>
            <span className="font-medium">WhatsApp (Meta)</span> — sipariş/teklif iletişimi
          </li>
          <li>
            <span className="font-medium">PayTR</span> — online kart ödemesi
            (kart bilgileri doğrudan PayTR&apos;nin güvenli sayfasına girilir,
            bu sitenin sunucularına ulaşmaz)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Veri Güvenliği">
        <p>
          Kişisel verilerinizin güvenliği için gerekli teknik ve idari
          tedbirler alınmaktadır. Ancak internet üzerinden hiçbir veri
          iletiminin veya elektronik depolama yönteminin %100 güvenli
          olmadığını hatırlatırız.
        </p>
      </LegalSection>

      <LegalSection title="7. Politika Değişiklikleri">
        <p>
          Bu Gizlilik Politikası zaman zaman güncellenebilir. Güncel
          sürüm her zaman bu sayfada yayınlanır.
        </p>
      </LegalSection>

      <LegalSection title="8. İletişim">
        <p>
          Sorularınız için {contact.email} adresinden bizimle iletişime
          geçebilirsiniz.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
