import { groq } from "next-sanity";

export const CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    order
  }
`;

// $categorySlug ve $search parametreleri null gönderilirse filtre uygulanmaz,
// böylece tek sorgu hem "tüm ürünler" hem filtreli listeleme için kullanılabilir.
export const PRODUCTS_QUERY = groq`
  *[_type == "product"
    && (!defined($categorySlug) || category->slug.current == $categorySlug)
    && (!defined($search) || name match $search + "*")
  ] | order(_createdAt desc) {
    _id,
    name,
    "slug": slug.current,
    mainImage,
    stockStatus,
    pricingOptions,
    featured,
    vatRate,
    "category": category->{ _id, title, "slug": slug.current }
  }
`;

export const FEATURED_PRODUCTS_QUERY = groq`
  *[_type == "product" && featured == true] | order(_createdAt desc) [0...8] {
    _id,
    name,
    "slug": slug.current,
    mainImage,
    stockStatus,
    pricingOptions,
    featured,
    vatRate,
    "category": category->{ _id, title, "slug": slug.current }
  }
`;

export const PRODUCT_BY_SLUG_QUERY = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    mainImage,
    gallery,
    description,
    stockStatus,
    pricingOptions,
    featured,
    vatRate,
    "category": category->{ _id, title, "slug": slug.current }
  }
`;

export const SITE_SETTINGS_QUERY = groq`
  *[_type == "siteSettings"][0] {
    siteIcon,
    favicon,
    siteTitle,
    siteTitleColor,
    siteDescription,
    siteDescriptionColor,
    whatsappNumber,
    phone,
    email,
    address,
    googleMapsEmbedUrl,
    aboutTitle,
    aboutText,
    aboutImages,
    catalogDownloadEnabled
  }
`;
