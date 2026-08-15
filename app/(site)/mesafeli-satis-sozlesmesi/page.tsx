import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/features/legal/legal-page-layout";
import { LegalSection } from "@/components/features/legal/legal-section";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <LegalPageLayout title="Mesafeli Satış Sözleşmesi">
      <LegalSection title="1. Taraflar">
        <p>
          <span className="font-medium">Satıcı:</span> {SITE_CONFIG.name}
          <br />
          Adres: {SITE_CONFIG.address}
          <br />
          E-posta: {SITE_CONFIG.email}
        </p>
        <p>
          <span className="font-medium">Alıcı:</span> Site üzerinden ürün
          seçip WhatsApp aracılığıyla sipariş veya teklif talebinde bulunan
          kişi/kurum.
        </p>
      </LegalSection>

      <LegalSection title="2. Sözleşmenin Konusu">
        <p>
          İşbu sözleşmenin konusu, Alıcı&apos;nın Satıcı&apos;ya ait
          internet sitesi üzerinden elektronik ortamda seçtiği ürün(ler)e
          ilişkin sipariş/teklif sürecinin ve tarafların hak ve
          yükümlülüklerinin belirlenmesidir.
        </p>
      </LegalSection>

      <LegalSection title="3. Sipariş Süreci">
        <p>
          Alıcı, Site üzerinden ürünleri sepete ekler ve WhatsApp&apos;a
          Gönder butonu ile talebini Satıcı&apos;ya iletir. Bu aşamada
          Site üzerinde bir ödeme işlemi gerçekleşmez; nihai fiyat,
          stok durumu, ödeme yöntemi ve teslimat detayları taraflar
          arasında WhatsApp üzerinden yapılan görüşmeyle netleştirilir ve
          sipariş bu görüşme sonucunda kesinleşir.
        </p>
      </LegalSection>

      <LegalSection title="4. Fiyatlandırma">
        <p>
          Site üzerinde ürünler için gösterilen fiyatlar bilgilendirme
          amaçlıdır ve stok/kampanya durumuna göre değişiklik
          gösterebilir. Siparişin kesinleştiği andaki güncel fiyat, Satıcı
          tarafından WhatsApp görüşmesinde teyit edilir.
        </p>
      </LegalSection>

      <LegalSection title="5. Teslimat">
        <p>
          Teslimat süresi ve yöntemi, sipariş onaylandıktan sonra
          taraflar arasında ayrıca belirlenir ve Alıcı&apos;ya WhatsApp
          üzerinden bildirilir.
        </p>
      </LegalSection>

      <LegalSection title="6. Cayma Hakkı">
        <p>
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
          Sözleşmeler Yönetmeliği kapsamında, tüketici sıfatıyla hareket
          eden Alıcılar, teslim tarihinden itibaren 14 (on dört) gün
          içinde herhangi bir gerekçe göstermeksizin sözleşmeden cayma
          hakkına sahiptir. Ticari/mesleki amaçla (B2B) yapılan alımlarda
          taraflar arasında ayrıca mutabık kalınmadıkça cayma hakkı
          hükümleri uygulanmayabilir. Niteliği itibarıyla iade edilemeyecek
          ürünler (özel üretim/kesim ürünler vb.) cayma hakkı kapsamı
          dışındadır.
        </p>
      </LegalSection>

      <LegalSection title="7. Mücbir Sebepler">
        <p>
          Doğal afet, isyan, savaş, grev, iletişim/altyapı sorunları gibi
          tarafların kontrolü dışında gelişen ve öngörülemeyen durumlarda,
          etkilenen taraf yükümlülüklerini zamanında yerine getiremediği
          için sorumlu tutulamaz.
        </p>
      </LegalSection>

      <LegalSection title="8. Uyuşmazlıkların Çözümü">
        <p>
          İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı
          tarafından ilan edilen parasal sınırlar dahilinde Tüketici
          Hakem Heyetleri, bu sınırları aşan uyuşmazlıklarda ise Tüketici
          Mahkemeleri yetkilidir.
        </p>
      </LegalSection>

      <LegalSection title="9. Yürürlük">
        <p>
          Alıcı&apos;nın WhatsApp&apos;a Gönder butonuna tıklayarak
          talebini iletmesi, işbu sözleşmenin şartlarını okuduğu ve kabul
          ettiği anlamına gelir.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
