import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { CategoryNav } from "@/components/features/catalog/category-nav";
import { ProductGrid } from "@/components/features/catalog/product-grid";
import { SearchBar } from "@/components/features/catalog/search-bar";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getSiteSettings,
} from "@/lib/sanity/fetchers";

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { q?: string };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    return { title: "Kategori Bulunamadı" };
  }

  return {
    title: category.title,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const search = searchParams.q;

  const [categories, products, siteSettings] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: params.slug, search }),
    getSiteSettings(),
  ]);

  const showCatalogDownload = siteSettings?.catalogDownloadEnabled !== false;

  return (
    <div>
      <CategoryNav categories={categories} activeCategory={category.slug} />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-navy">
            Ürünlerimiz
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{category.title}</span>
        </nav>

        <h1 className="text-2xl font-bold text-brand-navy">
          {category.title}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            {category.description}
          </p>
        )}

        <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
