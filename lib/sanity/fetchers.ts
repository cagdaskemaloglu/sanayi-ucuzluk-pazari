import { client } from "./client";
import {
  CATEGORIES_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  PRODUCTS_QUERY,
  FEATURED_PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  SITE_SETTINGS_QUERY,
  POSTS_QUERY,
  POST_BY_SLUG_QUERY,
} from "./queries";
import type {
  BlogPostDetail,
  BlogPostListItem,
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

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  return client.fetch(CATEGORY_BY_SLUG_QUERY, { slug }, FETCH_OPTIONS);
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

export async function getFeaturedProducts(): Promise<ProductListItem[]> {
  return client.fetch(FEATURED_PRODUCTS_QUERY, {}, FETCH_OPTIONS);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  return client.fetch(PRODUCT_BY_SLUG_QUERY, { slug }, FETCH_OPTIONS);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(SITE_SETTINGS_QUERY, {}, FETCH_OPTIONS);
}

export async function getBlogPosts(): Promise<BlogPostListItem[]> {
  return client.fetch(POSTS_QUERY, {}, FETCH_OPTIONS);
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPostDetail | null> {
  return client.fetch(POST_BY_SLUG_QUERY, { slug }, FETCH_OPTIONS);
}
