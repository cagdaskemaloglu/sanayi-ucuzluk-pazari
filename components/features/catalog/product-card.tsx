import Image from "next/image";
import Link from "next/link";
import { urlForImage } from "@/lib/sanity/image";
import { CardPurchasePanel } from "@/components/features/catalog/card-purchase-panel";
import { ShippingDayBadge } from "@/components/features/product/shipping-day-badge";
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
        {product.appliedDiscount && !isOutOfStock && (
          <span className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            {product.appliedDiscount.label}
          </span>
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

        {!isOutOfStock && <ShippingDayBadge />}

        <CardPurchasePanel
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
