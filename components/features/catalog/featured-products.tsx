import { ProductCard } from "./product-card";
import type { ProductListItem } from "@/lib/sanity/types";

export function FeaturedProducts({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-gray-200 bg-amber-50/40">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="text-lg font-bold text-brand-navy">
          Öne Çıkan Ürünler
        </h2>
        <div className="scrollbar-hide mt-4 flex gap-4 overflow-x-auto pb-1">
          {products.map((product) => (
            <div key={product._id} className="w-40 shrink-0 sm:w-48">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
