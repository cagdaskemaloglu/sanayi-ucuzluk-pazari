import { getProductsForFeed, getSiteSettings } from "@/lib/sanity/fetchers";
import { urlForImage } from "@/lib/sanity/image";
import { SITE_CONFIG } from "@/lib/constants";
import {
  absoluteUrl,
  getPrimaryPricingOption,
  priceIncludingVat,
  unitSuffix,
} from "@/lib/seo";

// Google Merchant Center ürün feed'i (RSS 2.0 + g: alanları).
// Merchant Center → Ürünler → Feed ekle → "Planlanmış getirme" ile bu
// adres verilir: https://<domain>/feeds/google-merchant.xml
// Her istekte Sanity'den güncel veri çekilir; CDN'de 1 saat önbelleklenir.
export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // XML'de geçersiz kontrol karakterlerini temizle.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function tag(name: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  return `      <${name}>${escapeXml(String(value))}</${name}>\n`;
}

export async function GET() {
  const [products, siteSettings] = await Promise.all([
    getProductsForFeed(),
    getSiteSettings().catch(() => null),
  ]);

  const siteName = siteSettings?.siteTitle || SITE_CONFIG.name;
  const shippingFee = siteSettings?.shippingFee;
  const freeThreshold = siteSettings?.freeShippingThreshold;

  const items = products
    .map((product) => {
      const option = getPrimaryPricingOption(product.pricingOptions);
      if (!option || !product.mainImage) return "";

      const price = priceIncludingVat(option.price, product.vatRate);
      const suffix = unitSuffix(option);
      const title = suffix ? `${product.name} - ${suffix}` : product.name;
      const description =
        product.description?.trim() ||
        `${product.name}. ${product.category?.title ?? ""} kategorisinde toptan ve perakende satış.`;

      const imageLink = urlForImage(product.mainImage)
        .width(1200)
        .height(1200)
        .url();
      const additionalImages = (product.gallery ?? [])
        .slice(0, 10)
        .map((image) => urlForImage(image).width(1200).height(1200).url());

      // Barkod yoksa ve marka+MPN ikilisi de yoksa Google'a ürünün
      // standart bir tanımlayıcısı olmadığını açıkça bildiriyoruz.
      const hasIdentifier =
        Boolean(product.gtin) || Boolean(product.brand && product.mpn);

      let shipping = "";
      if (shippingFee !== undefined && shippingFee !== null) {
        const isFree =
          shippingFee === 0 ||
          (freeThreshold !== undefined &&
            freeThreshold !== null &&
            price >= freeThreshold);
        shipping =
          "      <g:shipping>\n" +
          "        <g:country>TR</g:country>\n" +
          `        <g:price>${(isFree ? 0 : shippingFee).toFixed(2)} TRY</g:price>\n` +
          "      </g:shipping>\n";
      }

      return (
        "    <item>\n" +
        tag("g:id", product.sku || product._id) +
        tag("g:title", title.slice(0, 150)) +
        tag("g:description", description.slice(0, 5000)) +
        tag("g:link", absoluteUrl(`/urun/${product.slug}`)) +
        tag("g:image_link", imageLink) +
        additionalImages.map((url) => tag("g:additional_image_link", url)).join("") +
        tag(
          "g:availability",
          product.stockStatus === "out_of_stock" ? "out_of_stock" : "in_stock"
        ) +
        tag("g:price", `${price.toFixed(2)} TRY`) +
        tag("g:condition", "new") +
        tag("g:brand", product.brand) +
        tag("g:gtin", product.gtin) +
        tag("g:mpn", product.mpn) +
        (hasIdentifier ? "" : tag("g:identifier_exists", "no")) +
        tag(
          "g:multipack",
          option.unitType !== "adet" && option.piecesPerUnit && option.piecesPerUnit > 1
            ? option.piecesPerUnit
            : undefined
        ) +
        tag("g:product_type", product.category?.title) +
        shipping +
        "    </item>\n"
      );
    })
    .join("");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' +
    "  <channel>\n" +
    `    <title>${escapeXml(siteName)}</title>\n` +
    `    <link>${escapeXml(absoluteUrl("/"))}</link>\n` +
    `    <description>${escapeXml(siteSettings?.siteDescription || SITE_CONFIG.description)}</description>\n` +
    items +
    "  </channel>\n" +
    "</rss>\n";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
