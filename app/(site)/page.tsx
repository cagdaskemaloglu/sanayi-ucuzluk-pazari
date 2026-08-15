import { Suspense } from "react";
import { CategoryNav } from "@/components/features/catalog/category-nav";
import { ProductGrid } from "@/components/features/catalog/product-grid";
import { SearchBar } from "@/components/features/catalog/search-bar";
import { getCategories, getProducts } from "@/lib/sanity/fetchers";

interface HomePageProps {
  searchParams: {
    category?: string;
    q?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const categorySlug = searchParams.category;
  const search = searchParams.q;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug, search }),
  ]);

  return (
    <div>
      <CategoryNav
        categories={categories}
        activeCategory={categorySlug}
        search={search}
      />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <Suspense fallback={<div className="mb-4 h-10 rounded-md bg-gray-100" />}>
          <SearchBar defaultValue={search} />
        </Suspense>

        <ProductGrid products={products} />
      </div>
    </div>
  );
}
