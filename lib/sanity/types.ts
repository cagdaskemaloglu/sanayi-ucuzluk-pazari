import type { Image } from "sanity";

export type PricingUnitType = "adet" | "kutu" | "koli" | "palet";

export interface PricingOption {
  unitType: PricingUnitType;
  piecesPerUnit?: number;
  price: number;
}

export interface Category {
  _id: string;
  title: string;
  slug: string;
  order?: number;
}

export interface ProductListItem {
  _id: string;
  name: string;
  slug: string;
  mainImage: Image;
  stockStatus: "in_stock" | "out_of_stock";
  pricingOptions: PricingOption[];
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
  whatsappNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  googleMapsEmbedUrl?: string;
  aboutTitle?: string;
  aboutText?: string;
  aboutImages?: Image[];
}
