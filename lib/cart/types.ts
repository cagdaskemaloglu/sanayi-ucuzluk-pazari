import type { BulkTierLike } from "@/lib/pricing";

export interface CartItem {
  id: string; // `${productId}-${unitType}` formatında benzersiz anahtar
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  unitType: string;
  piecesPerUnit?: number;
  price: number; // temel (kademesiz) birim fiyat
  bulkTiers?: BulkTierLike[];
  quantity: number;
}
