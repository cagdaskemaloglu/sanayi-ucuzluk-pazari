# Sanayi Ucuzluk Pazarı — Faz 1, 2 & 3

## Kurulum

```bash
npm install
```

Yeni shadcn bileşenleri eklemek istersen (örn. sheet, separator, skeleton —
Faz 5'te sepet popover için gerekecek):

```bash
npx shadcn@latest add sheet separator skeleton
```

## Çalıştırma

```bash
npm run dev
```

`http://localhost:3000` adresinde açılır.

## Klasör yapısı (route groups)

- `app/(site)/` → header, footer, whatsapp butonu SADECE burada uygulanır.
  İçinde `page.tsx` (ana sayfa/ürün grid'i), `sanity-test/`, `loading.tsx`,
  `error.tsx`, `not-found.tsx` var. `(site)` parantezli klasör adı URL'e
  yansımaz — yani ana sayfa hâlâ `/` olarak çalışır.
- `app/studio/` → bu gruptan tamamen ayrı, Sanity Studio kendi tam ekran
  arayüzünü header/footer olmadan yönetir (scroll sorunu bu sayede çözüldü).
- `app/layout.tsx` (root) → sadece `<html>`/`<body>`, font ve metadata.

## Faz 1 — Proje İskeleti

- Next.js 14 App Router + TypeScript strict
- Tailwind CSS + shadcn/ui altyapısı
- Sticky header (koyu lacivert) + sağ üstte sepet ikonu (Faz 5'te aktif olacak)
- Sağ altta sabit WhatsApp butonu, footer
- `loading.tsx`, `error.tsx`, `not-found.tsx` (404) sayfaları

## Faz 2 — Sanity Studio Kurulumu

### 1. Sanity hesabı ve proje oluştur

1. [sanity.io/manage](https://www.sanity.io/manage) adresine git, ücretsiz hesap aç/giriş yap.
2. **Create new project** ile yeni proje oluştur (isim: "Sanayi Ucuzluk Pazarı").
3. Üstte görünen **Project ID**'yi kopyala.
4. Dataset olarak `production` otomatik oluşur, öyle bırak.

### 2. Ortam değişkenlerini doldur

```bash
cp .env.example .env.local
```

İçine Project ID'ni yaz:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=buraya-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

### 3. CORS izni ekle

sanity.io/manage → projen → **API** sekmesi → **CORS Origins** → **Add CORS origin**:
- Origin: `http://localhost:3000`
- **Allow credentials** kutucuğunu işaretle → Save

### 4. Kur ve çalıştır

```bash
npm install
npm run dev
```

### 5. Studio'yu aç, örnek veri gir

`http://localhost:3000/studio` → Sanity hesabınla giriş yap.

1. **Site Ayarları** → WhatsApp numaranı (örn. `905551234567`) ve diğer bilgileri gir, **Publish**.
2. **Kategori** → en az 1-2 örnek kategori oluştur, **Publish**.
3. **Ürün** → en az 1-2 örnek ürün oluştur (kategori seç, ana fotoğraf yükle,
   Satış Birimleri'ne en az bir birim ekle — örn. Koli, 30 adet, 150 ₺), **Publish**.

### 6. Bağlantıyı test et

`http://localhost:3000/sanity-test` → girdiğin veriler JSON olarak görünmeli.

## Faz 3 — Kategori Menüsü & Ürün Listeleme

### Ne eklendi

- Ana sayfa (`/`) artık Sanity'den gerçek kategori ve ürün verisini çekiyor
- Header altında sabit (sticky) kategori menüsü — "Tümü" ve her kategori
  tıklanabilir pill buton, seçim URL'de `?category=slug` olarak tutulur
- Arama kutusu — yazarken ~400ms gecikmeyle URL'e `?q=...` yansır, ürün
  adına göre filtreler; kategori seçimiyle birlikte çalışır
- Ürün kartları: fotoğraf, ürün adı, satış birimleri rozetleri
  (Adet/Kutu/Koli/Palet — **fiyat kartta gösterilmez**, sadece birim ve
  varsa adet sayısı), Sepete Ekle butonu
- Stokta olmayan ürünlerde "Stokta Yok" rozeti + buton devre dışı

### Test

1. `npm run dev` → `/` adresine git
2. Faz 2'de girdiğin test ürünü kartta görünmeli
3. Kategori menüsünden farklı kategoriye tıkla → URL değişmeli, liste filtrelenmeli
4. Arama kutusuna ürün adının bir kısmını yaz → kısa gecikmeyle liste filtrelenmeli
5. Studio'da birkaç ürün daha ekleyip (farklı kategorilerde) grid'in güncellendiğini doğrula

### Bilinen durum (henüz normal — sıradaki fazlarda tamamlanacak)

- Ürün kartındaki fotoğraf/isme tıklayınca `/urun/[slug]`'a gider ama bu
  sayfa henüz yok → **404 görmen normal**, Faz 4'te eklenecek
- "Sepete Ekle" butonu şimdilik görsel, tıklayınca bir şey olmaz →
  gerçek sepet mantığı **Faz 5**'te bağlanacak
- Header'daki sepet ikonu da aynı şekilde placeholder
- Header/whatsapp butonu henüz Sanity `siteSettings`'teki WhatsApp
  numarasını kullanmıyor (hâlâ `lib/constants.ts`'te placeholder) →
  **Faz 6**'da gerçek veriye bağlanacak

## Faz 4 — Ürün Detay Sayfası & Footer Geliştirmeleri

### Ne eklendi

- Ürün detay sayfası: `/urun/[slug]`
  - Çoklu fotoğraf galerisi (ana fotoğraf + ek fotoğraflar arasında thumbnail ile geçiş)
  - Ürün açıklaması
  - Satış birimi seçici (Adet/Kutu/Koli/Palet arasında radio ile seçim, seçilen birime göre fiyat gösterimi)
  - Stokta yok durumunda rozet + buton devre dışı
  - Breadcrumb (Ürünlerimiz / Kategori / Ürün adı)
  - `generateMetadata` ile dinamik sayfa başlığı
- **Footer'ın hemen üzerine "Hakkımızda" bölümü eklendi** — Studio'da
  Site Ayarları → "Hakkımızda Başlığı" ve "Hakkımızda Metni" alanlarını
  doldurursan otomatik görünür; boşsa bölüm hiç render edilmez.
- **Footer'a Google Haritalar konumu eklendi** — iki seçenek:
  1. Studio'da Site Ayarları → "Google Haritalar Embed Linki" alanına,
     Google Haritalar'da işyerini bulup Paylaş → Bir harita katıştır →
     `src="..."` değerini yapıştır (en doğru/kesin konum için önerilir).
  2. Boş bırakırsan, "Adres" alanındaki metinden otomatik bir harita
     oluşturulur (API anahtarı gerekmez ama adres metnine bağlı, daha az kesin).

### Test

1. Studio'da (`/studio`) Site Ayarları'na git:
   - Hakkımızda Başlığı + Hakkımızda Metni gir → Publish
   - İstersen Google Haritalar embed linkini yapıştır (yoksa Adres alanı yeterli) → Publish
2. `/` adresinde bir ürün kartına tıkla → artık 404 değil, ürün detay
   sayfası açılmalı
3. Birden fazla fotoğraf eklediğin bir üründe thumbnail'lere tıklayıp
   galerinin çalıştığını doğrula
4. Birden fazla satış birimi olan bir üründe radio butonlarla seçim
   yapıp fiyatın değiştiğini doğrula
5. Sayfayı en alta kaydır → Hakkımızda bölümü ve harita footer'ın
   hemen üzerinde görünmeli

### Bilinen durum (henüz normal)

- "Sepete Ekle" butonları (kart ve detay sayfası) hâlâ görsel placeholder,
  gerçek sepet mantığı **Faz 5**'te bağlanacak



- Renk paleti `tailwind.config.ts` içinde `brand.navy`, `brand.accent` vb.
  olarak tanımlı, değiştirmek istersen oradan güncelle.
- `/sanity-test` geçici bir debug sayfasıdır, ileride kaldırılabilir.

## Faz 5 — Sepet Sistemi

### Ne eklendi

- Gerçek sepet state yönetimi (React Context + useReducer), sayfa
  yenilense bile sepet `localStorage`'da saklanıyor (tarayıcı kapanıp
  açılsa bile kaybolmuyor)
- Sağ üstteki sepet ikonu artık gerçek ürün sayısını gösteriyor, tıklayınca
  sağdan açılan popover (Sheet) çalışıyor
- Ürün kartındaki "Sepete Ekle" artık gerçekten ekliyor (ilk tanımlı satış
  birimiyle — farklı birim seçmek isteyen ürün detay sayfasına gidebilir)
- Ürün detay sayfasında birim seçimi + miktar seçici ile sepete ekleme
- Sepet popover'ında: ürün listesi (görsel, isim, birim, miktar +/-,
  kaldır), toplam tutar, **Ad Soyad** input alanı
- Bir ürün sepete eklendiğinde popover otomatik açılıyor

### Test

1. `npm run dev` → `/` adresine git
2. Bir ürün kartında "Sepete Ekle"ye tıkla → sağdan sepet popover'ı
   açılmalı, ürün görünmeli, header'daki sepet ikonunda sayı güncellenmeli
3. Popover içinde miktarı +/- ile değiştir, bir ürünü kaldır (çöp kutusu ikonu)
4. Ürün detay sayfasında farklı bir satış birimi seçip miktarı artırıp
   sepete ekle → doğru birim/fiyatla eklenmeli
5. Ad Soyad alanına bir şey yaz, sayfayı yenile (F5) → sepet ve isim
   **kaybolmamalı** (localStorage'dan geri geliyor)
6. Sepeti tamamen boşalt (tüm ürünleri kaldır) → "Sepetiniz boş" mesajı görünmeli

### Bilinen durum (henüz normal)

- "WhatsApp'a Gönder" butonu şimdilik devre dışı (gri) — gerçek gönderim
  mantığı **Faz 6**'da bağlanacak

## Faz 6 — WhatsApp Gönderim Entegrasyonu & Bot Koruması

### Ne eklendi

- Sepet popover'ında Ad Soyad'ın altına **isteğe bağlı Mesaj (not) alanı** eklendi
- "WhatsApp'a Gönder" butonu artık gerçekten çalışıyor:
  - Sepetteki tüm ürünler, birim/miktar/fiyat bilgisiyle okunaklı bir
    mesaja dönüştürülüyor
  - Ad Soyad ve (girildiyse) not mesaja ekleniyor
  - Buton, Sanity Studio → Site Ayarları'ndaki WhatsApp numarasına
    `wa.me` linki ile yeni sekmede açılıyor
  - Gönderim sonrası sepet otomatik temizleniyor ve popover kapanıyor
- Sağ alttaki sabit WhatsApp butonu da artık Studio'daki gerçek numarayı kullanıyor
- **Cloudflare Turnstile bot koruması** (opsiyonel): `.env.local`'e site
  key + secret key eklersen, WhatsApp'a göndermeden önce kullanıcının
  Turnstile doğrulamasını geçmesi gerekir. Anahtarlar boşsa bu adım
  otomatik atlanır — kurulum zorunlu değil.

### Turnstile kurmak istersen (opsiyonel)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile** → **Add Site**
2. Domain olarak `localhost` da ekleyebilirsin (test için)
3. Widget Mode: **Managed** seç
4. Oluşan **Site Key** ve **Secret Key**'i `.env.local`'e ekle:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=buraya-site-key
TURNSTILE_SECRET_KEY=buraya-secret-key
```

5. Dev server'ı yeniden başlat (`.env.local` değişince her zaman gerekli)

### Test

1. Studio'da Site Ayarları'ndaki WhatsApp numarasının doğru formatta
   olduğundan emin ol (örn. `905551234567`)
2. Sepete bir ürün ekle, Ad Soyad gir, istersen Mesaj alanına bir not yaz
3. "WhatsApp'a Gönder"e tıkla → yeni sekmede WhatsApp Web/uygulama açılmalı,
   mesaj ürün listesi + toplam + ad soyad + (varsa) notla otomatik dolu gelmeli
4. Gönderdikten sonra sepetin boşaldığını ve popover'ın kapandığını doğrula
5. Ad Soyad boşken buton devre dışı kalmalı, altında uyarı metni görünmeli
6. **Turnstile kurduysan:** doğrulamayı tamamlamadan buton devre dışı
   kalmalı; kurmadıysan bu adım hiç görünmemeli ve buton normal çalışmalı

### Bilinen durum (henüz normal)

- SEO (metadata detayları, sitemap, JSON-LD) → **Faz 7**
- Mobil özel ince ayarlar → **Faz 8**
- KVKK/Gizlilik Politikası gibi yasal sayfalar → **Faz 9**
- Canlıya alma (Vercel/Cloudflare DNS) → **Faz 10**

## Faz 6 Güncellemesi

Kullanıcı geri bildirimine göre iki değişiklik yapıldı:

- **Ad Soyad artık zorunlu değil** — boş bırakılıp "WhatsApp'a Gönder"e
  tıklanabilir. Doldurulursa mesaja eklenir, boşsa mesajda o satır hiç
  görünmez. (Turnstile kurulduysa doğrulama hâlâ zorunlu.)
- **Mesajda artık her ürünün linki de var** — WhatsApp mesajında ürün
  adı/fiyat satırının hemen altında o ürünün detay sayfasına
  (`/urun/[slug]`) giden tam link yer alıyor. Link, gönderim anındaki
  tarayıcı adresinden (`window.location.origin`) otomatik oluşuyor —
  yani localhost'ta test ederken localhost linki, canlıya alınca gerçek
  domain linki gelecek, ayrı bir ayar gerekmiyor.

## Faz 7 — SEO & Performans

### Ne eklendi

- `metadataBase` root layout'a eklendi — tüm sayfalardaki Open Graph
  görselleri artık tam (absolute) URL ile doğru şekilde oluşuyor
- Ürün sayfalarında `generateMetadata` genişletildi: Open Graph title,
  description ve ürün fotoğrafı (sosyal medyada paylaşınca kart olarak görünür)
- Ürün detay sayfasına **JSON-LD yapısal veri** eklendi (Google'ın ürün
  zengin sonuçları için) — ürün adı, açıklaması, kategorisi, en düşük
  fiyatlı satış birimi ve stok durumu
- `/sitemap.xml` — tüm kategoriler ve ürünler otomatik listeleniyor,
  Sanity'de yeni ürün eklendikçe otomatik güncellenir
- `/robots.txt` — `/studio` ve `/sanity-test` arama motorlarından
  gizlendi, sitemap linki eklendi
- `next/image` zaten Faz 3-4'ten beri kullanılıyordu (otomatik boyutlandırma/optimizasyon)

### Test

1. `npm run dev` → `http://localhost:3000/sitemap.xml` → XML olarak
   ana sayfa + kategoriler + ürünler listelenmeli
2. `http://localhost:3000/robots.txt` → `/studio` ve `/sanity-test`
   disallow edilmiş görünmeli, sitemap linki olmalı
3. Bir ürün sayfasında tarayıcıda "Sayfa Kaynağını Görüntüle" (View
   Page Source) → `<script type="application/ld+json">` içinde ürün
   bilgilerinin doğru geldiğini kontrol et
4. İstersen [Google Rich Results Test](https://search.google.com/test/rich-results)
   aracına canlıya aldıktan sonra ürün linkini yapıştırıp doğrulayabilirsin
   (localhost linkleri bu araçla test edilemez)

### Not

- `NEXT_PUBLIC_SITE_URL` boş bırakıldıysa sitemap/robots/JSON-LD linkleri
  `http://localhost:3000` ile oluşur — bu geliştirme için sorun değil.
  **Canlıya almadan önce** (`Faz 10`) `.env`'e gerçek domaini yazmayı unutma.

## Faz 8 — Responsive & Mobil Optimizasyon

### Ne değişti

- **Header**: dar ekranlarda uzun site adı artık sepet ikonunun üzerine
  binmiyor, gerekirse "..." ile kısaltılıyor (truncate)
- **Kategori menüsü**: yatay kaydırmadaki görünür scrollbar gizlendi
  (kaydırma işlevi aynen çalışıyor), pill butonların dokunma alanı biraz büyütüldü
- **Ürün detay sayfası**: breadcrumb (Ürünlerimiz / Kategori / Ürün adı)
  artık dar ekranlarda taşmıyor, gerekirse alt satıra geçiyor; çok uzun
  ürün adları breadcrumb'da kısaltılıyor; galerideki thumbnail satırının
  scrollbar'ı gizlendi
- **Ürün detay — birim/miktar/sepete ekle satırı**: dar ekranlarda
  (≈640px altı) miktar seçici ve buton alt alta diziliyor, orta ve büyük
  ekranlarda yan yana
- **Sepet popover'ı**: miktar +/- ve kaldır butonlarının dokunma alanı
  büyütüldü (mobilde parmakla basmak daha kolay)
- Diğer bileşenler (ürün grid'i, footer, hakkımızda, sepet genişliği)
  zaten önceki fazlarda responsive tasarlanmıştı, bu fazda sadece test
  edilip doğrulandı

### Test

Tarayıcıda geliştirici araçları (F12) → cihaz simülasyonu (örn. iPhone SE
375px, iPhone 14 390px, iPad 768px) ile şunları kontrol et:

1. Header'da site adı sepet ikonuyla çakışmıyor
2. Kategori menüsü yatay kaydırılabiliyor, scrollbar görünmüyor
3. Ürün grid'i 2 sütun (mobil) → 3-4-5 sütun (büyüyen ekran) şeklinde uyum sağlıyor
4. Ürün detay sayfasında breadcrumb taşmıyor, galeri thumbnail'leri kaydırılabiliyor
5. Sepete ürün ekle → popover tam ekran genişliğinde açılıyor (mobilde),
   miktar butonlarına parmakla basmak rahat
6. Sağ alt WhatsApp butonu ve header'daki sepet ikonu her zaman aynı
   yerde kalıyor, scroll ile kaybolmuyor
7. Gerçek bir telefonla da (varsa) hızlıca göz gezdir — simülatör her
   şeyi yakalamayabilir

## Faz 9 — Yasal Sayfalar & Güven Unsurları

### Ne eklendi

- **`/kvkk`** — KVKK Aydınlatma Metni (veri sorumlusu, işlenen veriler,
  işlenme amacı, WhatsApp üzerinden aktarım, ilgili kişinin hakları)
- **`/gizlilik-politikasi`** — Gizlilik Politikası (toplanan bilgiler,
  localStorage kullanımı, üçüncü taraf hizmet sağlayıcılar: Vercel,
  Cloudflare, Sanity, WhatsApp)
- **`/mesafeli-satis-sozlesmesi`** — Mesafeli Satış Sözleşmesi (sipariş
  süreci WhatsApp üzerinden yürüdüğü için buna göre yazıldı — sitede
  ödeme alınmıyor, fiyat/teslimat WhatsApp görüşmesinde netleşiyor)
- **`/iletisim`** — Telefon, e-posta, adres, WhatsApp butonu ve harita
  (Sanity Site Ayarları'ndaki bilgileri kullanıyor)
- Footer'a bu 4 sayfaya link eklendi
- Yeni sayfalar `/sitemap.xml`'e eklendi

### ⚠️ Önemli — Bu metinler şablondur

KVKK, Gizlilik Politikası ve Mesafeli Satış Sözleşmesi sayfalarının
üstünde bunu hatırlatan sarı bir uyarı kutusu var. Bu metinler genel
bir başlangıç noktası olarak yazıldı; işletmenizin gerçek durumuna
(tüzel kişilik bilgileri, ödeme altyapısı seçimi, iade/teslimat
politikaları vb.) göre bir hukuk danışmanına onaylatmadan yayına
almamanızı öneririz. Özellikle Faz 10'da bir ödeme altyapısı
(izyco/Paytr vb.) eklenirse bu metinlerin güncellenmesi gerekecektir.

### Test

1. `npm run dev` → footer'daki 4 linke tıklayıp her sayfanın açıldığını doğrula
2. `/iletisim` sayfasında telefon/e-posta linklerinin tıklanabilir
   olduğunu (tel: ve mailto:), WhatsApp butonunun doğru numarayı
   açtığını, haritanın göründüğünü kontrol et
3. `/sitemap.xml` içinde yeni sayfaların listelendiğini doğrula

## Faz 10 — Deployment (Vercel + Cloudflare + Analytics)

### Kapsam kararları

- **Ödeme altyapısı eklenmedi** — sipariş süreci WhatsApp üzerinden
  devam ediyor, sitede online ödeme yok
- **Vercel Analytics eklendi** — ziyaretçi istatistikleri için (paket
  kuruldu, Vercel'e deploy edilince aktif olacak)
- **Resend/e-posta bildirimi eklenmedi** — WhatsApp bildirimi yeterli görüldü

### Ne eklendi

- `@vercel/analytics` paketi ve `<Analytics />` bileşeni `(site)` grubuna
  eklendi (Studio'daki admin trafiği istatistiklere karışmasın diye
  sadece herkese açık sayfalarda çalışıyor)

### 1. Projeyi GitHub'a yükle

Vercel, GitHub/GitLab/Bitbucket üzerinden otomatik deploy kurar. Eğer
proje henüz bir Git deposunda değilse:

```bash
git init
git add .
git commit -m "İlk commit"
```

GitHub'da boş bir repo oluştur, sonra:

```bash
git remote add origin https://github.com/kullanici-adin/sanayi-ucuzluk-pazari.git
git branch -M main
git push -u origin main
```

### 2. Vercel'e bağla

1. [vercel.com](https://vercel.com) → GitHub hesabınla giriş yap
2. **Add New** → **Project** → GitHub reponu seç → **Import**
3. Framework otomatik **Next.js** olarak algılanır, ayar değiştirmene gerek yok
4. **Environment Variables** kısmına `.env.local`'deki her değişkeni tek
   tek ekle:

   | Değişken | Değer |
   |---|---|
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID'n |
   | `NEXT_PUBLIC_SANITY_DATASET` | `production` |
   | `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-01-01` |
   | `NEXT_PUBLIC_SITE_URL` | Gerçek domainin (örn. `https://sanayiucuzlukpazari.com`) — aşağıdaki adım 4'te domaini bağladıktan sonra bunu girip yeniden deploy edeceksin |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | (Turnstile kurduysan) |
   | `TURNSTILE_SECRET_KEY` | (Turnstile kurduysan) |

5. **Deploy**'a tıkla. Birkaç dakika içinde `*.vercel.app` uzantılı geçici
   bir linkle siten yayında olacak

### 3. Sanity CORS'a production domainini ekle

sanity.io/manage → projen → **API** → **CORS Origins** → **Add CORS origin**:
- Hem Vercel'in verdiği `*.vercel.app` linkini hem de (bağladıktan sonra)
  gerçek domainini ekle, **Allow credentials** işaretli olsun

### 4. Kendi domainini bağla (Cloudflare)

1. Domainin Cloudflare'de değilse: Cloudflare Dashboard → **Add a Site** →
   domainini gir → Cloudflare'in verdiği nameserver'ları domainini satın
   aldığın yerde (GoDaddı, Natro, vb.) güncelle
2. Vercel projende → **Settings** → **Domains** → domainini yaz → **Add**
3. Vercel sana bir CNAME (www için) ve A/ALIAS kaydı (kök domain için)
   gösterecek — bu kayıtları Cloudflare **DNS** sekmesinde ekle
4. Cloudflare'de kayıtların yanındaki turuncu bulut ikonunu (Proxy)
   açık bırakabilirsin — bu Cloudflare'in cache/güvenlik katmanını devreye sokar
5. Vercel'de domain "Valid Configuration" gösterene kadar bekle (birkaç
   dakika-birkaç saat sürebilir, DNS yayılımına bağlı)
6. Vercel ortam değişkenlerinde `NEXT_PUBLIC_SITE_URL`'i gerçek domainle
   güncelle → **Redeploy** (Deployments sekmesinden son deploy'u yeniden tetikle)

### 5. Vercel Analytics'i aktif et

Vercel Dashboard → projen → **Analytics** sekmesi → **Enable**. Paket zaten
kodda hazır, bu adım sadece veri toplamayı dashboard'da açıyor. Ücretsiz
plan sınırlı ama küçük/orta trafikli bir site için yeterli.

### 6. Turnstile'ı kurarsan (hatırlatma)

Daha önce ertelemiştik — kurduğunda:
1. Cloudflare Turnstile ayarlarına production domainini de ekle (localhost'un yanına)
2. Site Key + Secret Key'i Vercel ortam değişkenlerine de ekle
3. Redeploy et

### 7. Son kontrol listesi

- [ ] Sanity Studio'da tüm gerçek ürünler/kategoriler girildi
- [ ] Site Ayarları'ndaki WhatsApp numarası, adres, telefon gerçek bilgiler
- [ ] `NEXT_PUBLIC_SITE_URL` production domaine güncellendi, redeploy edildi
- [ ] `/sitemap.xml` ve `/robots.txt` gerçek domainle doğru görünüyor
- [ ] Bir ürünü sepete ekleyip gerçek WhatsApp numarana test siparişi gönder
- [ ] Mobilden gerçek bir cihazla siteyi gez
- [ ] KVKK/Gizlilik/Mesafeli Satış metinlerini hukuk danışmanına onaylat
- [ ] (Varsa) Turnstile production domain için kuruldu

Bu adımdan sonra proje canlıda! 🎉

## Güncelleme — Hakkımızda Fotoğrafları

Sanity Studio → Site Ayarları → **Hakkımızda Fotoğrafları** alanına
1 ile 6 arası fotoğraf eklenebilir (opsiyonel):

- **0 fotoğraf**: eskisi gibi sade, ortalanmış metin bloğu
- **1 fotoğraf**: metnin yanında büyük görsel (masaüstünde yan yana,
  mobilde alt alta)
- **2-6 fotoğraf**: metin üstte, altında küçük bir galeri grid'i

Fotoğraf eklemek zorunlu değil — boş bırakılırsa hiçbir şey değişmez.

## Güncelleme — Kartta Birim/Miktar Seçimi

Ana sayfadaki ürün kartlarında "Sepete Ekle" artık ilk satış birimini
otomatik eklemiyor. Tıklandığında küçük bir popover açılıyor:

- Ürünün tüm satış birimleri (Adet/Kutu/Koli/Palet) fiyatlarıyla listeleniyor
- Miktar +/- ile seçilebiliyor
- "Ekle" ile seçilen birim/miktar sepete ekleniyor

Sadece tek satış birimi olan ürünlerde de aynı popover açılır (miktar
seçebilmek için) — birim seçimi olmadığı için sadece tek satır görünür.
Stokta olmayan ürünlerde buton yine devre dışı, popover açılmaz.

### Test

1. Birden fazla satış birimi olan bir üründe karttaki "Sepete Ekle"ye tıkla
   → popover açılmalı, birimler ve fiyatları görünmeli
2. Bir birim seç, miktarı 3'e çıkar, "Ekle"ye tıkla → sepette doğru
   birim/miktarla eklenmiş olmalı, sepet popover'ı otomatik açılmalı
3. Aynı ürünü farklı bir birimle tekrar ekle → sepette iki ayrı satır
   olarak görünmeli (örn. "3 Koli" ve "1 Palet" ayrı satırlar)

## Güncelleme — Satış/Dönüşüm Geliştirmeleri

### 1. Öne Çıkan Ürünler

Sanity Studio → bir ürünü aç → **"Öne Çıkan Ürün"** kutucuğunu işaretle
→ Publish. Ana sayfada (filtresiz/varsayılan görünümde), kategori
menüsünün üzerinde yatay kaydırılabilir bir "Öne Çıkan Ürünler" bölümü
otomatik belirir. En fazla 8 ürün gösterilir. Hiç öne çıkan ürün
işaretlenmediyse bölüm hiç görünmez. Bir kategori filtrelendiğinde veya
arama yapıldığında bu bölüm gizlenir (odak ürün listesinde kalsın diye).

### 2. İndirilebilir Fiyat Listesi (Excel)

Ana sayfada arama kutusunun yanında **"Fiyat Listesini İndir"** linki
eklendi. Tıklandığında `sanayi-ucuzluk-pazari-fiyat-listesi.xlsx` adında
bir Excel dosyası iner — tüm ürünler, satış birimleri, fiyatlar, toplu
alım kademeleri ve stok durumu tek tabloda. Dosya her istekte Sanity'den
**anlık** üretilir, yani Studio'da yaptığın her değişiklik bir sonraki
indirmede otomatik yansır — ayrıca güncellemene gerek yok.

Teknik: `/api/fiyat-listesi` route'u (`app/api/fiyat-listesi/route.ts`),
`xlsx` (SheetJS) paketiyle sunucu tarafında oluşturuluyor.

### 3. Miktar Bazlı Kademeli Fiyatlandırma

Sanity Studio → bir ürünün satış birimlerinden birini aç → **"Toplu Alım
Kademeleri"** alanına istediğin kadar kademe ekleyebilirsin. Örnek:

- 10 ve üzeri: 140 ₺/birim
- 25 ve üzeri: 125 ₺/birim

Müşteri miktarı artırdıkça (ürün detay sayfasında veya kart popover'ında)
karşıladığı en avantajlı kademe otomatik uygulanır, "Toplu alım indirimi
uygulandı" notuyla gösterilir. Sepette, sepet toplamında ve WhatsApp
mesajında da bu indirimli fiyat kullanılır. Kademe girmezsen ürün eskisi
gibi sabit fiyatla çalışmaya devam eder — tamamen opsiyonel.

### Test

1. `npm run dev` → Studio'da 2-3 ürünü "Öne Çıkan Ürün" işaretle, Publish
   et → ana sayfada üstte görünmeli
2. "Fiyat Listesini İndir"e tıkla → Excel dosyası inmeli, Excel/Google
   Sheets'te açıp verilerin doğru geldiğini kontrol et
3. Bir ürünün bir satış birimine 2 kademe ekle (örn. 5+ ve 10+), Publish
   et → ürün detay sayfasında miktarı 5'e çıkar, fiyatın otomatik
   düştüğünü ve "Toplu alım indirimi uygulandı" notunun çıktığını doğrula
4. Aynı ürünü sepete ekleyip miktarı sepette de değiştir → fiyatın
   kademeye göre güncellendiğini, sepet toplamının doğru olduğunu kontrol et
5. WhatsApp'a gönder → mesajdaki fiyatların indirimli tutarları
   yansıttığını kontrol et

## Güncelleme — Header İkonu, Dinamik Başlık/Açıklama & Favicon

Sanity Studio → Site Ayarları'na yeni alanlar eklendi (hepsi opsiyonel,
boş bırakılırsa hiçbir şey bozulmaz, mevcut varsayılanlar kullanılır):

- **Header İkonu** — site adının yanında küçük bir ikon/logo gösterir
  (kare görsel önerilir). Boşsa sadece site adı görünür, layout bozulmaz.
- **Favicon** — tarayıcı sekmesindeki ikon. Boşsa varsayılan (yok) kalır.
- **Site Başlığı** — header'da ve sayfa başlıklarında (`<title>`)
  "Sanayi Ucuzluk Pazarı" yerine kullanılır.
- **Site Başlığı Rengi** — hex kod (örn. `#F5A623`). Boşsa beyaz kalır.
- **Site Açıklaması** — Google/sosyal medya paylaşımlarında görünen kısa
  açıklama; ayrıca header'da başlığın altında küçük bir alt yazı olarak
  da gösterilir (sadece sm ve üstü ekranlarda, mobilde yer kazanmak için gizli).
- **Site Açıklaması Rengi** — açıklama metninin rengi (hex kod).

### Test

1. Studio'da Site Ayarları'na gir, "Header İkonu" alanına bir logo yükle,
   Publish et → header'da site adının solunda görünmeli
2. "Site Başlığı"nı değiştir (örn. "SUP Toptan") → header ve tarayıcı
   sekmesi başlığı güncellenmeli
3. "Site Başlığı Rengi"ne `#F5A623` gibi bir hex kod gir → header'daki
   başlık o renkte görünmeli
4. "Favicon" alanına bir görsel yükle → tarayıcı sekmesinde ikon
   görünmeli (bazı tarayıcılar favicon'u cache'leyebilir, görünmezse
   sekmeyi kapatıp yeniden aç veya hard refresh yap)
5. Tüm bu alanları boş bırakıp Publish et → site eskisi gibi
   varsayılan görünüme dönmeli, hiçbir şey kırılmamalı

## Güncelleme — Header Rengi, Kart Buton Rengi & Katalog İndir

- **Header arka planı beyaza çevrildi** (önceden koyu lacivertti).
  Metin renkleri kontrast için koyulaştırıldı (varsayılan başlık rengi
  artık lacivert, açıklama gri). Studio'dan girilen özel "Site Başlığı
  Rengi" / "Site Açıklaması Rengi" hâlâ her zaman öncelikli.
- **Sepet ikonu** (header sağ üst) da beyaz arka plana göre yeniden
  renklendirildi (artık gri kenarlıklı, lacivert ikonlu).
- **Ürün kartındaki "Sepete Ekle" butonu** artık turuncu değil,
  footer'ın lacivert tonunda (`brand-navy-dark`).
- **"Fiyat Listesini İndir" → "Katalog İndir"** olarak yeniden
  adlandırıldı, indirme adresi `/api/katalog` oldu (eski
  `/api/fiyat-listesi` kaldırıldı).
- **Katalog indirme butonu artık Studio'dan açılıp kapatılabiliyor** —
  Site Ayarları → "Katalog İndirme Butonu Aktif mi?" kutucuğunu
  kapatırsan buton ana sayfada hiç görünmez. Varsayılan: açık.

### Test

1. Ana sayfada header'ın artık beyaz olduğunu, sepet ikonunun okunaklı
   göründüğünü kontrol et
2. Bir ürün kartındaki "Sepete Ekle" butonunun artık lacivert (footer
   ile aynı ton) olduğunu doğrula
3. "Katalog İndir" butonuna tıkla → `sanayi-ucuzluk-pazari-katalog.xlsx`
   inmeli
4. Studio → Site Ayarları → "Katalog İndirme Butonu Aktif mi?"
   kutucuğunu kapat, Publish et → ana sayfada buton kaybolmalı; tekrar
   aç → geri gelmeli

## Güncelleme — KDV, Adres Alanı & Online Öde

### Ne değişti

- **Ürün fiyatları artık KDV HARİÇ girilir.** Sanity Studio → her ürünün
  "KDV Oranı (%)" alanına o ürüne uygulanacak oranı gir (örn. 20, 10, 1).
  Varsayılan %20. Bu alan girilmezse (eski ürünlerde) sistem otomatik
  %20 kabul eder — hiçbir şey kırılmaz.
- **Sepete Adres alanı eklendi** — Ad Soyad ile Mesaj arasında, opsiyonel.
- **"WhatsApp'a Gönder" butonu artık yeşil** (WhatsApp'ın kendi rengi) ve
  üzerinde **KDV HARİÇ toplam tutar** yazıyor. WhatsApp entegrasyonu
  (sipariş/teklif talebi) hâlâ bu buton üzerinden yürüyor, mesaj içeriği
  aynı mantıkla oluşuyor (artık adres bilgisi de mesaja ekleniyor).
- **Bu butonun altında ürün bazında KDV dökümü** listeleniyor (her ürün
  kendi satırında, KDV oranı ve tutarıyla), altında toplam KDV, en altta
  da **"Online Öde"** butonu — üzerinde **KDV DAHİL genel toplam** yazıyor.
- **"Online Öde" butonu** `/odeme` sayfasına yönlendirir; ödeme akışı için
  aşağıdaki "PayTR Entegrasyonu" bölümüne bak.
- Katalog Excel dosyasına da KDV oranı ve KDV dahil fiyat sütunları eklendi.

### Test

1. Studio'da bir ürünün KDV Oranı'nı %20'den farklı bir değere (örn. %10)
   değiştir, Publish et
2. O ürünü sepete ekle → sepet popover'ında alt kısımdaki KDV dökümünde
   doğru oranın kullanıldığını kontrol et
3. Adres alanına bir şeyler yaz → WhatsApp'a gönderince mesajda adres de
   görünmeli
4. "WhatsApp'a Gönder" butonundaki tutarın KDV hariç toplamla, "Online
   Öde" butonundaki tutarın KDV dahil toplamla eşleştiğini doğrula
   (aradaki fark toplam KDV tutarına eşit olmalı)
5. "Katalog İndir" ile Excel'i indirip yeni KDV sütunlarının doğru
   geldiğini kontrol et
6. `npm run build` çalıştırıp hatasız tamamlandığını doğrula (Vercel'e
   göndermeden önce her zaman önerilir)

### Sıradaki adım (senden bekleyen)

İyzico hesabını oluşturup API anahtarlarını aldığında haber ver — "Online
Öde" butonunu gerçek ödeme akışına bağlayalım (checkout formu, ödeme
sayfası, başarılı/başarısız dönüş sayfaları, .env'e API key ekleme vb.).

## Güncelleme — Header Üstü İletişim Çubuğu

Header'ın hemen üstüne ince bir bilgi çubuğu eklendi. Arka plan rengi
`#150136` (footer ile aynı ton), üzerinde sırasıyla:

- 📧 E-posta (mail ikonu)
- 📞 Telefon (telefon ikonu)
- 📍 Adres (konum ikonu)

Bilgiler Sanity Studio → Site Ayarları'ndan geliyor (aynı e-posta/telefon/
adres alanları footer'da da kullanılıyor). Üçü de boşsa çubuk hiç görünmez.

Bu çubuk **sticky değil** — sayfa aşağı kaydırılınca normal akışla
birlikte kaybolur, hemen altındaki header (sepet ikonu vb.) eskisi gibi
en üstte sabit kalmaya devam eder.

### Test

1. `npm run dev` → ana sayfada header'ın üstünde koyu mor bir çubukta
   e-posta/telefon/adresin göründüğünü kontrol et
2. Sayfayı aşağı kaydır → çubuk kaybolmalı, header sepet ikonuyla
   birlikte en üstte sabit kalmalı
3. Studio'da Site Ayarları'ndaki telefon/e-posta/adresi değiştirip
   Publish et → çubuktaki bilgiler güncellenmeli
4. Dar ekranda (mobil) test et — bilgiler sığmazsa alt satıra geçmeli,
   taşma olmamalı

## Düzeltme — Arama Kutusu / Katalog İndir Hizalaması

`SearchBar` bileşeninin kendi içinde tanımlı `mb-4` (alt boşluk), ana
sayfadaki flex satırında "Katalog İndir" linkiyle dikey hizasının
kaymasına neden oluyordu. `mb-4` bileşenden kaldırıldı, boşluk
sorumluluğu tamamen üst bileşene (`app/(site)/page.tsx`) bırakıldı.
Artık ikisi de aynı yatay hizada.

## Güncelleme — SEO & Trafik (Kategori Sayfaları & Blog)

### 1. Kategori Sayfaları Kendi URL'lerine Kavuştu

Kategoriler artık `/?category=slug` filtresi yerine **kendi gerçek
sayfalarına** sahip: `/kategori/[slug]`. Bu, Google'ın kategori
sayfalarını doğru indekslemesi için önemli bir değişiklik.

- Studio'da her kategoriye **"Açıklama (SEO)"** alanı eklendi — kategori
  sayfasının başlığının altında görünür, aynı zamanda Google arama
  sonucundaki açıklama olarak kullanılır (1-2 cümle yeterli)
- Ana sayfadaki kategori menüsü artık bu yeni sayfalara yönlendiriyor
- Ana sayfa artık sadece "Tümü ürünler + arama" görünümü (kategori
  filtresi kendi sayfasına taşındığı için `?category=` parametresi
  kaldırıldı)
- `/sitemap.xml`'deki kategori linkleri yeni URL yapısına güncellendi

**Not:** Eğer eskiden paylaştığın `/?category=xxx` linkleri varsa artık
kategori filtrelemez (ana sayfa gibi tüm ürünleri gösterir). Yeni linkler
`/kategori/xxx` formatında.

### 2. Blog / Bilgi Bölümü

Yeni bir içerik türü: **Blog Yazısı**. Studio'da menüden ekleyip
yayınlayabilirsin:

- Başlık, Slug, Kapak Fotoğrafı, Kısa Özet
- Yayın Tarihi (ileri bir tarih girersen o tarihe kadar sitede görünmez —
  ileriye dönük planlama için kullanışlı)
- İçerik: zengin metin editörü (başlıklar, paragraflar, listeler,
  alıntılar, görsel ekleyebilme)

Sayfalar:
- `/blog` — tüm yayınlanmış yazıların listesi (kapak fotoğrafı, başlık, özet, tarih)
- `/blog/[slug]` — yazının tam içeriği

Footer'a "Blog" linki eklendi. Blog yazıları da `/sitemap.xml`'e dahil.

### Test

1. `npm install` (yeni paket: `@portabletext/react`)
2. Studio'da bir kategoriye "Açıklama (SEO)" yaz, Publish et → ana
   sayfadaki kategori menüsünden o kategoriye tıkla → artık
   `/kategori/slug` adresine gitmeli, açıklaman başlığın altında görünmeli
3. Studio'da yeni bir "Blog Yazısı" oluştur (başlık, kapak fotoğrafı,
   özet, en az bir paragraf içerik), Publish et
4. `/blog` adresine git → yazın kartlarda görünmeli, tıklayınca içeriğin
   doğru render olduğunu kontrol et
5. Footer'daki "Blog" linkine tıkla → `/blog`'a gitmeli
6. `/sitemap.xml` içinde `/kategori/...` ve `/blog/...` adreslerinin
   listelendiğini doğrula
7. `npm run build` çalıştırıp hatasız tamamlandığını doğrula

## Güncelleme — PayTR Entegrasyonu (Online Öde)

> iyzico ile anlaşma sağlanamadığı için ödeme altyapısı **PayTR (iFrame API)**
> olarak değiştirildi. iyzico'ya ait tüm kod ve dokümantasyon kaldırıldı.

### Nasıl çalışıyor

Kart bilgileri hiçbir zaman bu sitenin sunucusundan veya sayfasından geçmez —
PayTR'nin kendi barındırdığı ödeme formu (iframe) kullanılır:

1. Sepette "Online Öde" → `/odeme` sayfası. Müşteri Ad, Soyad, E-posta,
   Telefon, Şehir ve Adres girer (**TC Kimlik No artık istenmiyor**).
2. Tarayıcı sunucuya **sadece ürün, birim ve adet** gönderir. Tutarı, KDV'yi
   ve toplu alım indirimini **sunucu Sanity'deki güncel fiyatlardan kendisi
   hesaplar** (`lib/checkout/compute-lines.ts`) — istek değiştirilerek daha
   ucuza ödeme başlatılamaz.
3. `/api/odeme/baslat`, PayTR'den bir ödeme token'ı alır ve Sanity'ye
   **"Beklemede"** durumunda bir Sipariş kaydı yazar.
4. PayTR'nin güvenli ödeme formu sayfaya gömülür, müşteri kartıyla öder.
5. PayTR ödeme sonucunu **sunucudan sunucuya** `/api/odeme/bildirim`
   adresine bildirir. Hash doğrulanır, sipariş **"Ödendi"** veya
   **"Başarısız"** yapılır ve PayTR'ye düz metin `OK` döndürülür.
   Ödemenin alındığının tek güvenilir kanıtı budur.
6. Müşteri `/odeme/basarili` (sepet temizlenir) veya `/odeme/basarisiz`
   sayfasına yönlendirilir. Bu sayfalar sadece bilgilendiricidir.

### Kurulum

1. PayTR Mağaza Paneli → **Destek & Kurulum → Bilgi** sayfasından üç değeri al:
   Mağaza No, Mağaza Parolası, Mağaza Gizli Anahtarı.
2. `.env.local`'e ekle:

```
PAYTR_MERCHANT_ID=...        # Mağaza No
PAYTR_MERCHANT_KEY=...       # Mağaza Parolası
PAYTR_MERCHANT_SALT=...      # Mağaza Gizli Anahtarı
PAYTR_TEST_MODE=1            # canlıya geçince 0
SANITY_API_TOKEN=...         # Editor yetkili token (sipariş kaydı için)
```

3. `npm install`, `rm -rf .next`, dev server'ı yeniden başlat.

> **Sanity token'ı artık daha önemli:** `SANITY_API_TOKEN` tanımlıysa ama sipariş
> kaydı yazılamazsa ödeme **başlatılmaz** (kayıtsız para tahsil edilmesin diye).
> Hiç tanımlı değilse sipariş kaydı tutulmaz ve ödeme yine çalışır — ama
> ödemeleri sadece PayTR panelinden görürsün.

### ⚠️ Bildirim URL'sini PayTR panelinde tanımla (zorunlu)

PayTR, ödeme sonucunu **her istekte gönderdiğimiz bir adrese değil, panelde
tanımlı tek bir "Bildirim URL"ine** yollar:

PayTR Mağaza Paneli → **Destek & Kurulum → Ayarlar → Bildirim URL Ayarları**:

```
https://SENIN-DOMAININ.com/api/odeme/bildirim
```

- Adres **herkese açık** olmalı (giriş/üyelik kısıtı olmamalı).
- Cloudflare kullanıyorsan **Bot Fight Mode / WAF kuralları** PayTR'nin POST
  isteğini engellemesin (gerekirse bu yol için istisna ekle).
- Bildirim URL'si tanımlı değilse müşteri ödemeyi yapar ama sipariş
  **"Beklemede"** kalır.

### Localhost'ta test

- Müşterinin dış IP'si PayTR için zorunludur; yerelde `::1`/`127.0.0.1`
  kabul edilmez. Geliştirme ortamında IP otomatik bulunur (api.ipify.org).
  Bulunamazsa `.env.local`'e `PAYTR_USER_IP_OVERRIDE=<dış IP'n>` yaz.
- PayTR localhost'a bildirim gönderemez. Siparişin "Ödendi"ye dönmesini yerelde
  de görmek istersen bir tünel aç (ör. `cloudflared tunnel --url
  http://localhost:3000` veya ngrok) ve verdiği HTTPS adresini **geçici olarak**
  panelde Bildirim URL'si yap. Tünelsiz de ödeme formunu ve yönlendirmeleri
  test edebilirsin; sadece sipariş durumu güncellenmez.
- Test kartı bilgileri için PayTR geliştirici dokümantasyonuna bak
  (dev.paytr.com → test kart bilgileri).

### Notlar

- **Taksit:** Şu an taksit seçenekleri açık (`no_installment=0`). Taksitli
  ödemede PayTR'nin bildirdiği tutar vade farkı yüzünden sipariş tutarından
  yüksek olabilir; Sipariş kaydında **"Tahsil Edilen Tutar"** olarak ayrıca
  tutulur. Taksiti kapatmak için `lib/paytr/client.ts` içindeki
  `noInstallment` değerini `"1"` yap.
- **Eski test siparişleri:** iyzico döneminden kalan test siparişlerinde
  Studio, artık şemada olmayan alanlar için uyarı gösterebilir; bu
  kayıtları Studio'dan silebilirsin.
- **Yasal metinler** (KVKK, Gizlilik Politikası, Mesafeli Satış Sözleşmesi)
  online ödemeyi ve PayTR'yi anacak şekilde güncellendi; yine de hukuk
  danışmanına onaylatman önerilir.

## Güncelleme — Google Search Console Hazırlığı

### Şimdi yapılan (kod tarafı)

- Site Ayarları'na **"Google Search Console Doğrulama Kodu"** alanı
  eklendi — Google'ın verdiği doğrulama kodunu buraya yapıştırınca
  otomatik olarak sitenin `<head>`'ine doğru meta etiketi ekleniyor
- `/odeme` ve `/api` altındaki sayfalar `robots.txt`'te disallow edildi
  (bunlar işlevsel/özel sayfalar, arama sonuçlarında çıkmamalı)
- `/sitemap.xml` zaten tüm ürünleri, kategorileri, blog yazılarını ve
  statik sayfaları içeriyor (Faz 7 ve sonrasında kuruldu)

### ⚠️ Önce şunu tamamlaman gerekiyor

Google Search Console, **gerçek ve herkese açık bir domain** gerektirir
— localhost'u doğrulayamaz veya tarayamaz. Bu adımlara geçmeden önce
README'deki **Faz 10** bölümünü tamamlayıp siteni Vercel + Cloudflare
ile gerçek bir domain'de canlıya almış olman gerekiyor. Ayrıca:

- Vercel ortam değişkenlerinde `NEXT_PUBLIC_SITE_URL`'in gerçek
  domainine ayarlı olduğundan emin ol (bu, sitemap ve doğrulama
  etiketinin doğru adresle çalışması için kritik)

### Site canlıya alındıktan sonra — adım adım

1. [search.google.com/search-console](https://search.google.com/search-console) adresine git, Google hesabınla giriş yap
2. **Mülk Ekle** (Add Property) → iki seçenek çıkar:

   **Seçenek A — Domain (önerilen, Cloudflare kullandığın için kolay):**
   - "Domain" seçeneğine domainini yaz (örn. `sanayiucuzlukpazari.com`)
   - Google sana bir TXT kaydı verir
   - Cloudflare Dashboard → domainin → **DNS** → **Add record** →
     Type: `TXT`, Name: `@`, Content: Google'ın verdiği değer → Save
   - Search Console'a dön, **Doğrula**'ya tıkla (DNS yayılımı birkaç
     dakika sürebilir)

   **Seçenek B — URL Öneki (HTML etiketi ile, DNS'e dokunmadan):**
   - "URL prefix" seçeneğine `https://senin-domainin.com` yaz
   - Doğrulama yöntemi olarak **HTML tag**'i seç
   - Sana verilen `<meta name="google-site-verification" content="XXXXX" />`
     etiketindeki **sadece `content="..."` içindeki değeri** kopyala
   - Sanity Studio → Site Ayarları → **"Google Search Console Doğrulama
     Kodu"** alanına yapıştır, Publish et
   - Sitenin canlı adresine git, sayfa kaynağını görüntüleyip
     (View Page Source) `<head>` içinde bu etiketin göründüğünü
     kontrol et
   - Search Console'a dön, **Doğrula**'ya tıkla

3. Doğrulandıktan sonra sol menüden **Sitemaps**'e git, alan kutusuna
   sadece `sitemap.xml` yaz (tam URL'e gerek yok), **Gönder**
4. Sol menüden **URL Denetimi** (URL Inspection) ile ana sayfanın
   adresini yapıştır, **Dizine Ekleme İste** (Request Indexing) —
   bu Google'ın siteni daha hızlı taramasını sağlar
5. Aynı şekilde birkaç önemli ürün/kategori sayfası için de dizine
   ekleme isteyebilirsin (hepsi için gerek yok, sitemap zaten hepsini
   Google'a bildirir)

### Ne kadar sürer?

Google'ın siteni tarayıp arama sonuçlarında göstermesi genelde
**birkaç gün ile birkaç hafta** arasında değişir — bu tamamen Google'ın
kontrolünde, hızlandıramayız. "Dizine Ekleme İste" adımı süreci
kısaltabilir ama garanti vermez.

### Bonus (opsiyonel, istersen ayrıca kurabilirsin)

- **Bing Webmaster Tools** ([bing.com/webmasters](https://www.bing.com/webmasters)) —
  benzer bir süreç, Bing ve Yahoo aramalarında da çıkmak için. Search
  Console doğrulamasını içe aktarabiliyor (tek tıkla), ekstra ayar
  gerekmeyebilir.

## Güncelleme — Üst Çubukta Instagram İkonu

Header üstündeki ince bilgi çubuğuna (e-posta/telefon/adres) Instagram
ikonu eklendi. Sanity Studio → Site Ayarları → **"Instagram Linki"**
alanına tam profil linkini gir (örn. `https://instagram.com/kullaniciadi`),
Publish et — ikon en sağda/sonda görünür, tıklanınca yeni sekmede
Instagram'ı açar. Boş bırakırsan ikon hiç görünmez.

### Test

1. `npm run dev` → Studio'da Instagram Linki'ni gir, Publish et
2. Ana sayfada üst çubukta Instagram ikonunun göründüğünü, tıklayınca
   doğru profile gittiğini kontrol et
3. Alanı boş bırakıp Publish et → ikon kaybolmalı, diğer bilgiler
   (e-posta/telefon/adres) etkilenmemeli

## Güncelleme — Üst Bilgi Çubuğuna Instagram İkonu

Header üstündeki bilgi çubuğuna (e-posta/telefon/adres) Instagram ikonu
eklendi. Sanity Studio → Site Ayarları → **"Instagram Linki"** alanına
tam profil linkini (örn. `https://instagram.com/kullaniciadi`) yapıştırıp
Publish edince çubukta ikon olarak görünür. Boş bırakılırsa hiç görünmez.

### Test

1. `npm run dev` → Studio'da Instagram Linki'ni doldur, Publish et
2. Ana sayfada üst bilgi çubuğunda Instagram ikonunun diğer bilgilerin
   yanında göründüğünü, tıklayınca yeni sekmede profile gittiğini kontrol et
3. Linki boşalt, Publish et → ikon kaybolmalı, diğer bilgiler etkilenmemeli
