import Image from "next/image";
import Link from "next/link";
import { urlForImage } from "@/lib/sanity/image";
import { UNIT_LABELS } from "@/lib/pricing";
import { AddToCartPopover } from "@/components/features/catalog/add-to-cart-popover";
import type { ProductListItem } from "@/lib/sanity/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const isOutOfStock = product.stockStatus === "out_of_stock";
  const imageUrl = product.mainImage
    ? urlForImage(product.mainImage).width(400).height(400).url()
    : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md">
      <Link
        href={`/urun/${product.slug}`}
        className="relative block aspect-square bg-gray-50"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-3"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Görsel yok
          </div>
        )}
        {isOutOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-gray-900/80 px-2 py-1 text-xs font-medium text-white">
            Stokta Yok
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/urun/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-brand-navy"
        >
          {product.name}
        </Link>

        {product.pricingOptions?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.pricingOptions.map((option, index) => (
              <span
                key={index}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600"
              >
                {UNIT_LABELS[option.unitType] ?? option.unitType}
                {option.piecesPerUnit ? ` (${option.piecesPerUnit})` : ""}
              </span>
            ))}
          </div>
        )}

        <AddToCartPopover
          productId={product._id}
          productSlug={product.slug}
          productName={product.name}
          imageUrl={imageUrl}
          pricingOptions={product.pricingOptions}
          isOutOfStock={isOutOfStock}
          vatRate={product.vatRate}
        />
      </div>
    </div>
  );
}
