import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/features/legal/legal-page-layout";
import { LegalSection } from "@/components/features/legal/legal-section";
import { getBusinessContact } from "@/lib/contact";
import { formatPrice } from "@/lib/pricing";
import { DEFAULT_RETURN_DAYS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "İade ve Kargo Koşulları",
  description:
    "Kargo ücretleri, teslimat süreleri, iade ve cayma hakkı koşulları.",
  alternates: { canonical: "/iade-ve-kargo" },
};

// Bu sayfadaki kargo/iade değerleri Sanity → Site Ayarları'ndan gelir.
// Google Merchant Center, mağazada kargo ve iade politikasının açıkça
// yazılı olmasını şart koşar.
export default async function IadeVeKargoPage() {
  const contact = await getBusinessContact();
  const settings = contact.siteSettings;

  const shippingFee = settings?.shippingFee;
  const freeThreshold = settings?.freeShippingThreshold;
  const minDays = settings?.deliveryMinDays;
  const maxDays = settings?.deliveryMaxDays;
  const returnDays = settings?.returnDays ?? DEFAULT_RETURN_DAYS;
  const freeReturns = settings?.freeReturns;

  const hasShippingFee = shippingFee !== undefined && shippingFee !== null;
  const hasFreeThreshold =
    freeThreshold !== undefined && freeThreshold !== null;
  const hasDeliveryDays = minDays !== undefined && maxDays !== undefined;

  return (
    <LegalPageLayout title="İade ve Kargo Koşulları">
      <LegalSection title="1. Kargo Ücreti">
        {hasShippingFee ? (
          shippingFee === 0 ? (
            <p>Türkiye genelindeki tüm siparişlerde kargo ücretsizdir.</p>
          ) : (
            <p>
              Türkiye geneli standart kargo ücreti{" "}
              <strong>{formatPrice(shippingFee)}</strong> (KDV dahil)
              olarak uygulanır.
              {hasFreeThreshold && (
                <>
                  {" "}
                  <strong>{formatPrice(freeThreshold)}</strong> ve üzeri
                  siparişlerde kargo ücretsizdir.
                </>
              )}
            </p>
          )
        ) : (
          <p>
            Kargo ücreti; siparişin hacmine, ağırlığına ve teslimat adresine
            göre belirlenir ve sipariş onayı sırasında size ayrıca bildirilir.
            Onayınız alınmadan kargo ücreti yansıtılmaz.
          </p>
        )}
        <p>
          Palet ve büyük hacimli siparişlerde ambar/nakliye ile gönderim
          yapılabilir; bu durumda nakliye ücreti ve yöntemi sipariş öncesinde
          sizinle birlikte belirlenir.
        </p>
      </LegalSection>

      <LegalSection title="2. Teslimat Süresi">
        <p>
          Stokta bulunan ürünler, ödemenin onaylanmasının ardından genellikle
          1 iş günü içinde kargoya verilir.
          {hasDeliveryDays && (
            <>
              {" "}
              Kargoya verilen siparişler {minDays}–{maxDays} iş günü içinde
              teslim edilir.
            </>
          )}
        </p>
        <p>
          Kargo takip bilgisi WhatsApp veya e-posta yoluyla size iletilir.
          Teslimatta paketi kontrol etmenizi, hasarlı paketler için kargo
          görevlisine tutanak tutturmanızı rica ederiz.
        </p>
      </LegalSection>

      <LegalSection title="3. İade ve Cayma Hakkı">
        <p>
          Tüketici sıfatıyla yaptığınız alışverişlerde, ürünü teslim
          aldığınız tarihten itibaren <strong>{returnDays} gün</strong>{" "}
          içinde herhangi bir gerekçe göstermeksizin iade edebilirsiniz
          (6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
          Sözleşmeler Yönetmeliği).
        </p>
        <p>
          İade edilecek ürünün kullanılmamış, hasarsız ve mümkünse orijinal
          ambalajında olması gerekir. Özel ölçü/kesim gibi kişiye özel
          hazırlanan ürünler cayma hakkı kapsamı dışındadır.
        </p>
      </LegalSection>

      <LegalSection title="4. İade Nasıl Yapılır?">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            İade talebinizi sipariş bilgilerinizle birlikte WhatsApp
            üzerinden veya {contact.email} adresine iletin.
          </li>
          <li>
            Size iletilecek kargo bilgisiyle ürünü faturasıyla birlikte
            gönderin.
          </li>
          <li>
            Ürün tarafımıza ulaşıp kontrol edildikten sonra ücret iadesi en
            geç 14 gün içinde, ödemeyi yaptığınız yöntemle (kartla
            ödemelerde aynı karta) yapılır.
          </li>
        </ol>
        {freeReturns !== undefined && (
          <p>
            {freeReturns
              ? "İade kargo ücreti tarafımızca karşılanır."
              : "Cayma hakkı kapsamındaki iadelerde, tarafımızca bildirilen anlaşmalı kargo ile gönderim yapılması halinde iade kargo ücreti tarafımızca karşılanır; farklı bir kargo firması ile gönderimlerde kargo ücreti alıcıya aittir."}
          </p>
        )}
      </LegalSection>

      <LegalSection title="5. Hasarlı veya Hatalı Ürün">
        <p>
          Ürün size hasarlı, eksik veya sipariş ettiğinizden farklı
          ulaştıysa, teslimattan itibaren en kısa sürede bizimle iletişime
          geçin. Bu durumlarda değişim veya iade masrafları tarafımızca
          karşılanır.
        </p>
      </LegalSection>

      <LegalSection title="6. İletişim">
        <p>
          {contact.name}
          <br />
          Adres: {contact.address}
          <br />
          Telefon: {contact.phone}
          <br />
          E-posta: {contact.email}
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
