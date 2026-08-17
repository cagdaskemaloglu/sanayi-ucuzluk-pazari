import type { BulkTierLike } from "@/lib/pricing";

export interface CartItem {
  id: string; // `${productId}-${unitType}` formatında benzersiz anahtar
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  unitType: string;
  piecesPerUnit?: number;
  price: number; // temel (kademesiz), KDV HARİÇ birim fiyat
  bulkTiers?: BulkTierLike[];
  vatRate?: number; // % — yoksa DEFAULT_VAT_RATE (20) kabul edilir
  quantity: number;
}
