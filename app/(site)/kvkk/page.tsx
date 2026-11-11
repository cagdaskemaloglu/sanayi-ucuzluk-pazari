import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/features/legal/legal-page-layout";
import { LegalSection } from "@/components/features/legal/legal-section";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
};

export default function KvkkPage() {
  return (
    <LegalPageLayout title="KVKK Aydınlatma Metni">
      <LegalSection title="1. Veri Sorumlusu">
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
          uyarınca, {SITE_CONFIG.name} (&quot;Şirket&quot;) veri sorumlusu
          sıfatıyla, kişisel verilerinizi aşağıda açıklanan kapsamda
          işlemektedir.
        </p>
        <p>
          Adres: {SITE_CONFIG.address}
          <br />
          E-posta: {SITE_CONFIG.email}
        </p>
      </LegalSection>

      <LegalSection title="2. İşlenen Kişisel Veriler">
        <p>
          Sitemiz üzerinden sepete ürün ekleyip WhatsApp üzerinden sipariş
          veya teklif talebinde bulunmanız halinde; ad-soyad bilginiz
          (paylaşmanız halinde), talep ettiğiniz ürün bilgileri ve
          iletmek istediğiniz mesaj/not içeriği tarafımızca işlenmektedir.
        </p>
      </LegalSection>

      <LegalSection title="3. Kişisel Verilerin İşlenme Amacı">
        <p>
          Toplanan kişisel veriler; sipariş ve teklif taleplerinin
          değerlendirilmesi, müşteri talepleriyle ilgili iletişimin
          sürdürülmesi ve satış süreçlerinin yürütülmesi amaçlarıyla
          işlenmektedir.
        </p>
      </LegalSection>

      <LegalSection title="4. Kişisel Verilerin Aktarılması">
        <p>
          Sipariş/teklif talebiniz, tarafınızca tercih edilmesi halinde
          WhatsApp (Meta Platforms, Inc.) üzerinden tarafımıza
          iletilmektedir. Bu kapsamda ilettiğiniz veriler, WhatsApp&apos;ın
          kendi gizlilik politikası ve veri işleme esasları çerçevesinde bu
          platform tarafından da işlenebilir.
        </p>
        <p>
          Online ödeme yapmanız halinde ad-soyad, e-posta, telefon, adres ve
          sipariş tutarı bilgileriniz, ödemenin gerçekleştirilebilmesi
          amacıyla ödeme kuruluşu PayTR&apos;ye aktarılır. Kart bilgileriniz
          doğrudan PayTR&apos;nin güvenli ödeme sayfasına girilir; tarafımızca
          görülmez ve saklanmaz.
        </p>
      </LegalSection>

      <LegalSection title="5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi">
        <p>
          Kişisel verileriniz, sitemizi kullanarak sepete ürün eklemeniz ve
          WhatsApp üzerinden gönder butonuna tıklamanız suretiyle, KVKK
          m.5/2 kapsamındaki &quot;bir sözleşmenin kurulması veya ifasıyla
          doğrudan doğruya ilgili olması&quot; ve talebiniz doğrultusunda
          verdiğiniz açık rıza hukuki sebeplerine dayanılarak elektronik
          ortamda toplanmaktadır.
        </p>
      </LegalSection>

      <LegalSection title="6. İlgili Kişinin Hakları (KVKK m.11)">
        <p>KVKK&apos;nın 11. maddesi uyarınca herkes veri sorumlusuna başvurarak;</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kişisel veri işlenip işlenmediğini öğrenme,</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
          <li>
            İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını
            öğrenme,
          </li>
          <li>
            Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,
          </li>
          <li>
            Eksik/yanlış işlenmişse düzeltilmesini isteme,
          </li>
          <li>
            KVKK m.7&apos;deki şartlar çerçevesinde silinmesini/yok
            edilmesini isteme,
          </li>
          <li>
            Yapılan işlemlerin, verilerin aktarıldığı üçüncü kişilere
            bildirilmesini isteme,
          </li>
          <li>
            Otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir
            sonuç ortaya çıkmasına itiraz etme,
          </li>
          <li>
            Kanuna aykırı işlenmesi nedeniyle zarara uğramanız halinde
            zararın giderilmesini talep etme
          </li>
        </ul>
        <p>haklarına sahiptir.</p>
      </LegalSection>

      <LegalSection title="7. Başvuru Yöntemi">
        <p>
          Bu haklarınızı kullanmak için taleplerinizi {SITE_CONFIG.email}{" "}
          adresine veya {SITE_CONFIG.address} adresine yazılı olarak
          iletebilirsiniz.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
