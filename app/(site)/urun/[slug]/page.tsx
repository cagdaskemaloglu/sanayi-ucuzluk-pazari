import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/features/product/product-gallery";
import { ProductPricingSelector } from "@/components/features/product/product-pricing-selector";
import { getProductBySlug } from "@/lib/sanity/fetchers";
import { urlForImage } from "@/lib/sanity/image";
import { SITE_CONFIG } from "@/lib/constants";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return { title: "Ürün Bulunamadı" };
  }

  const description = product.description?.slice(0, 160);
  const ogImageUrl = product.mainImage
    ? urlForImage(product.mainImage).width(1200).height(1200).url()
    : undefined;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stockStatus === "out_of_stock";
  const imageUrl = product.mainImage
    ? urlForImage(product.mainImage).width(400).height(400).url()
    : null;
  const jsonLdImageUrl = product.mainImage
    ? urlForImage(product.mainImage).width(1200).height(1200).url()
    : undefined;

  // Google'ın ürün zengin sonuçları (rich results) için yapısal veri.
  // En düşük fiyatlı satış birimi temsili fiyat olarak kullanılıyor.
  const lowestPrice = product.pricingOptions?.length
    ? Math.min(...product.pricingOptions.map((option) => option.price))
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: jsonLdImageUrl ? [jsonLdImageUrl] : undefined,
    category: product.category?.title,
    offers: lowestPrice
      ? {
          "@type": "Offer",
          url: `${SITE_CONFIG.url}/urun/${product.slug}`,
          priceCurrency: "TRY",
          price: lowestPrice,
          availability: isOutOfStock
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-navy">
          Ürünlerimiz
        </Link>
        <span>/</span>
        <Link
          href={`/?category=${product.category.slug}`}
          className="hover:text-brand-navy"
        >
          {product.category.title}
        </Link>
        <span>/</span>
        <span className="max-w-[200px] truncate text-gray-700 sm:max-w-none">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <ProductGallery
          productName={product.name}
          mainImage={product.mainImage}
          gallery={product.gallery}
        />

        <div>
          <h1 className="text-2xl font-bold text-brand-navy">
            {product.name}
          </h1>

          {isOutOfStock && (
            <span className="mt-2 inline-block rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
              Stokta Yok
            </span>
          )}

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-gray-600">
              {product.description}
            </p>
          )}

          <div className="mt-6">
            <ProductPricingSelector
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
      </div>
    </div>
  );
}
