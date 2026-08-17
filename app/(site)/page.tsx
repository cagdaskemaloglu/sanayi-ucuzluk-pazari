import { Suspense } from "react";
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

interface HomePageProps {
  searchParams: {
    category?: string;
    q?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const categorySlug = searchParams.category;
  const search = searchParams.q;
  const isDefaultView = !categorySlug && !search;

  const [categories, products, featuredProducts, siteSettings] =
    await Promise.all([
      getCategories(),
      getProducts({ categorySlug, search }),
      // Öne çıkan ürünler yalnızca varsayılan (filtresiz) görünümde gösterilir.
      isDefaultView ? getFeaturedProducts() : Promise.resolve([]),
      getSiteSettings(),
    ]);

  // Studio'da alan hiç girilmediyse (undefined) varsayılan olarak açık kalır;
  // sadece açıkça false yapılırsa buton gizlenir.
  const showCatalogDownload = siteSettings?.catalogDownloadEnabled !== false;

  return (
    <div>
      {isDefaultView && <FeaturedProducts products={featuredProducts} />}

      <CategoryNav
        categories={categories}
        activeCategory={categorySlug}
        search={search}
      />

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
