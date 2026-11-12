import { Suspense } from "react";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { CategoryNav } from "@/components/features/catalog/category-nav";
import { ProductGrid } from "@/components/features/catalog/product-grid";
import { SearchBar } from "@/components/features/catalog/search-bar";
import { FeaturedProducts } from "@/components/features/catalog/featured-products";
import {
  getCategories,
  getProducts,
  getFeaturedProducts,
  getSiteSettings,
} from "@/lib/sanity/fetchers";
import { urlForImage } from "@/lib/sanity/image";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_CONFIG } from "@/lib/constants";
import { absoluteUrl, buildReturnPolicy } from "@/lib/seo";

// Arama sonuçları (?q=...) ana sayfanın kopyası sayılmasın diye canonical
// her zaman ana sayfanın kendisi.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

interface HomePageProps {
  searchParams: {
    q?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const search = searchParams.q;
  const isDefaultView = !search;

  const [categories, products, featuredProducts, siteSettings] =
    await Promise.all([
      getCategories(),
      getProducts({ search }),
      // Öne çıkan ürünler yalnızca varsayılan (arama yapılmamış) görünümde gösterilir.
      isDefaultView ? getFeaturedProducts() : Promise.resolve([]),
      getSiteSettings(),
    ]);

  // Studio'da alan hiç girilmediyse (undefined) varsayılan olarak açık kalır;
  // sadece açıkça false yapılırsa buton gizlenir.
  const showCatalogDownload = siteSettings?.catalogDownloadEnabled !== false;

  const siteName = siteSettings?.siteTitle || SITE_CONFIG.name;
  const siteDescription =
    siteSettings?.siteDescription || SITE_CONFIG.description;
  const logoUrl = siteSettings?.siteIcon
    ? urlForImage(siteSettings.siteIcon).width(512).height(512).url()
    : undefined;

  // Google'ın işletmeyi (logo, iletişim, sosyal medya) ve site adını
  // tanıması için yapısal veri.
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteName,
    description: siteDescription,
    url: absoluteUrl("/"),
    logo: logoUrl,
    image: logoUrl,
    telephone: siteSettings?.phone || undefined,
    email: siteSettings?.email || undefined,
    address: siteSettings?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: siteSettings.address,
          addressCountry: "TR",
        }
      : undefined,
    sameAs: siteSettings?.instagramUrl ? [siteSettings.instagramUrl] : undefined,
    // İşletme düzeyinde iade politikası — Google bunu tüm ürünlere uygular.
    hasMerchantReturnPolicy: buildReturnPolicy(siteSettings),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: absoluteUrl("/"),
    inLanguage: "tr-TR",
  };

  return (
    <div>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      {/* Sayfanın ana başlığı — tasarımı değiştirmemek için görsel olarak
          gizli, ama arama motorları ve ekran okuyucular için mevcut. */}
      <h1 className="sr-only">
        {siteName} — {siteDescription}
      </h1>
      {isDefaultView && <FeaturedProducts products={featuredProducts} />}

      {/* activeCategory verilmiyor → "Tümü" pill'i aktif görünür */}
      <CategoryNav categories={categories} />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Suspense fallback={<div className="h-10 rounded-md bg-gray-100" />}>
              <SearchBar defaultValue={search} />
            </Suspense>
          </div>
          {showCatalogDownload && (
            <a
              href="/api/katalog"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand-navy hover:text-brand-navy"
            >
              <Download className="h-4 w-4" />
              Katalog İndir
            </a>
          )}
        </div>

        <ProductGrid products={products} />
      </div>
    </div>
  );
}
