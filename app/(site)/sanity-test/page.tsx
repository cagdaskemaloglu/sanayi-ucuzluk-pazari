import { getCategories, getProducts, getSiteSettings } from "@/lib/sanity/fetchers";

// Bu sayfa SADECE Faz 2'de Sanity bağlantısını test etmek içindir.
// Faz 3'te gerçek ürün grid'i geldiğinde bu route silinecek.
export default async function SanityTestPage() {
  const [categories, products, siteSettings] = await Promise.all([
    getCategories(),
    getProducts(),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-navy">
        Sanity Bağlantı Testi
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Bu sayfa geçicidir, Faz 3&apos;te kaldırılacaktır.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Kategoriler ({categories.length})
        </h2>
        <pre className="mt-2 overflow-auto rounded-md bg-gray-900 p-4 text-xs text-green-400">
          {JSON.stringify(categories, null, 2)}
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Ürünler ({products.length})
        </h2>
        <pre className="mt-2 overflow-auto rounded-md bg-gray-900 p-4 text-xs text-green-400">
          {JSON.stringify(products, null, 2)}
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Site Ayarları</h2>
        <pre className="mt-2 overflow-auto rounded-md bg-gray-900 p-4 text-xs text-green-400">
          {JSON.stringify(siteSettings, null, 2)}
        </pre>
      </section>
    </div>
  );
}
