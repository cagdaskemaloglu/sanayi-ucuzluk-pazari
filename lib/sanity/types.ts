import type { Image } from "sanity";

export type PricingUnitType = "adet" | "kutu" | "koli" | "palet";

export interface BulkTier {
  minQuantity: number;
  price: number;
}

export interface PricingOption {
  unitType: PricingUnitType;
  piecesPerUnit?: number;
  price: number;
  bulkTiers?: BulkTier[];
}

export interface Category {
  _id: string;
  title: string;
  slug: string;
  order?: number;
  description?: string;
}

export interface ProductListItem {
  _id: string;
  name: string;
  slug: string;
  mainImage: Image;
  stockStatus: "in_stock" | "out_of_stock";
  pricingOptions: PricingOption[];
  featured?: boolean;
  vatRate?: number;
  category: {
    _id: string;
    title: string;
    slug: string;
  };
}

export interface ProductDetail extends ProductListItem {
  gallery?: Image[];
  description?: string;
}

export interface SiteSettings {
  siteIcon?: Image;
  favicon?: Image;
  siteTitle?: string;
  siteTitleColor?: string;
  siteDescription?: string;
  siteDescriptionColor?: string;
  whatsappNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  googleMapsEmbedUrl?: string;
  aboutTitle?: string;
  aboutText?: string;
  aboutImages?: Image[];
  catalogDownloadEnabled?: boolean;
  instagramUrl?: string;
  googleSiteVerification?: string;
}

export interface BlogPostListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: Image;
  publishedAt: string;
}

export interface BlogPostDetail extends BlogPostListItem {
  // Sanity Portable Text — @portabletext/react ile render edilir.
  body: PortableTextBlockLike[];
}

// Portable Text bloklarının tam tipini import etmek yerine (ekstra paket
// bağımlılığı gerektirir), render katmanında @portabletext/react'in kendi
// tiplerine güvenip burada gevşek bir tip kullanıyoruz.
export type PortableTextBlockLike = Record<string, unknown>;
