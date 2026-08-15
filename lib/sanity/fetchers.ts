import { client } from "./client";
import {
  CATEGORIES_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  SITE_SETTINGS_QUERY,
} from "./queries";
import type {
  Category,
  ProductDetail,
  ProductListItem,
  SiteSettings,
} from "./types";

// cache: "no-store" → Next.js bu istekleri asla önbelleğe almaz, Studio'da
// yapılan her değişiklik (Publish edildiği anda) sitede hemen görünür.
// Trafik arttıkça performans için ileride ISR/on-demand revalidation'a
// geçilebilir, ama şu an için güncel içerik önceliğimiz.
const FETCH_OPTIONS = { cache: "no-store" as const };

export async function getCategories(): Promise<Category[]> {
  return client.fetch(CATEGORIES_QUERY, {}, FETCH_OPTIONS);
}

export async function getProducts(params?: {
  categorySlug?: string;
  search?: string;
}): Promise<ProductListItem[]> {
  return client.fetch(
    PRODUCTS_QUERY,
    {
      categorySlug: params?.categorySlug ?? null,
      search: params?.search ?? null,
    },
    FETCH_OPTIONS
  );
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  return client.fetch(PRODUCT_BY_SLUG_QUERY, { slug }, FETCH_OPTIONS);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(SITE_SETTINGS_QUERY, {}, FETCH_OPTIONS);
}
