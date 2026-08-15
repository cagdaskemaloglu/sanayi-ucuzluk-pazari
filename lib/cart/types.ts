export interface CartItem {
  id: string; // `${productId}-${unitType}` formatında benzersiz anahtar
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  unitType: string;
  piecesPerUnit?: number;
  price: number;
  quantity: number;
}
