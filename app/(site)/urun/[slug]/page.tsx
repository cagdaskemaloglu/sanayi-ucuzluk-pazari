import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/features/product/product-gallery";
import { ProductPricingSelector } from "@/components/features/product/product-pricing-selector";
import { JsonLd } from "@/components/seo/json-ld";
import { getProductBySlug, getSiteSettings } from "@/lib/sanity/fetchers";
import { urlForImage } from "@/lib/sanity/image";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildReturnPolicy,
  buildShippingDetails,
  getPrimaryPricingOption,
  priceIncludingVat,
  truncateDescription,
} from "@/lib/seo";

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

  const description = truncateDescription(
    product.description ||
      `${product.name} — ${product.category?.title ?? "Sanayi ve hırdavat"} kategorisinde toptan ve perakende satış. Adet, kutu ve koli seçenekleriyle uygun fiyat.`
  );
  const ogImageUrl = product.mainImage
    ? urlForImage(product.mainImage).width(1200).height(1200).url()
    : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/urun/${product.slug}`,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const [product, siteSettings] = await Promise.all([
    getProductBySlug(params.slug),
    getSiteSettings().catch(() => null),
  ]);

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stockStatus === "out_of_stock";
  const imageUrl = product.mainImage
    ? urlForImage(product.mainImage).width(400).height(400).url()
    : null;
  const productUrl = absoluteUrl(`/urun/${product.slug}`);
  const imageUrls = [product.mainImage, ...(product.gallery ?? [])]
    .filter(Boolean)
    .map((image) => urlForImage(image).width(1200).height(1200).url());

  // Google'ın ürün zengin sonuçları ve Google Alışveriş için yapısal veri.
  // Sayfada varsayılan seçili gelen ilk satış biriminin KDV DAHİL fiyatı
  // kullanılır — Türkiye'de Google fiyatın KDV dahil olmasını şart koşar ve
  // bu fiyat sayfada da ("KDV dahil" notu olarak) görünür.
  const primaryOption = getPrimaryPricingOption(product.pricingOptions);
  const offerPrice = primaryOption
    ? priceIncludingVat(primaryOption.price, product.vatRate)
    : undefined;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: imageUrls.length ? imageUrls : undefined,
    url: productUrl,
    category: product.category?.title,
    sku: product.sku || product._id,
    gtin: product.gtin || undefined,
    mpn: product.mpn || undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    offers:
      offerPrice !== undefined
        ? {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "TRY",
            price: offerPrice.toFixed(2),
            itemCondition: "https://schema.org/NewCondition",
            availability: isOutOfStock
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: siteSettings?.siteTitle || "Sanayi Ucuzluk Pazarı",
            },
            shippingDetails: buildShippingDetails(siteSettings, offerPrice),
            hasMerchantReturnPolicy: buildReturnPolicy(siteSettings),
          }
        : undefined,
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Ürünlerimiz", path: "/" },
    ...(product.category
      ? [
          {
            name: product.category.title,
            path: `/kategori/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, path: `/urun/${product.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-navy">
          Ürünlerimiz
        </Link>
        <span>/</span>
        <Link
          href={`/kategori/${product.category.slug}`}
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
