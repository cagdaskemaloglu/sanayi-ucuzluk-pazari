"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { UNIT_LABELS, formatPrice, getEffectiveUnitPrice } from "@/lib/pricing";
import type { PricingOption } from "@/lib/sanity/types";

interface ProductPricingSelectorProps {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  pricingOptions: PricingOption[];
  isOutOfStock: boolean;
  vatRate?: number;
}

export function ProductPricingSelector({
  productId,
  productSlug,
  productName,
  imageUrl,
  pricingOptions,
  isOutOfStock,
  vatRate,
}: ProductPricingSelectorProps) {
  const { addItem } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const selected = pricingOptions[selectedIndex];

  const effectiveUnitPrice = selected
    ? getEffectiveUnitPrice(selected.price, quantity, selected.bulkTiers)
    : 0;
  const isBulkDiscountApplied = selected
    ? effectiveUnitPrice < selected.price
    : false;

  function handleAddToCart() {
    if (!selected || isOutOfStock) return;
    addItem({
      id: `${productId}-${selected.unitType}`,
      productId,
      productSlug,
      productName,
      imageUrl,
      unitType: selected.unitType,
      piecesPerUnit: selected.piecesPerUnit,
      price: selected.price,
      bulkTiers: selected.bulkTiers,
      vatRate,
      quantity,
    });
    setQuantity(1);
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700">
        Satış Birimi Seç <span className="font-normal text-gray-400">(fiyatlar KDV hariç)</span>
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {pricingOptions.map((option, index) => (
          <label
            key={index}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-md border px-4 py-3 text-sm transition-colors",
              selectedIndex === index
                ? "border-brand-navy bg-brand-navy/5"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pricing-option"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  className="h-4 w-4 accent-brand-navy"
                />
                <span className="font-medium text-gray-800">
                  {UNIT_LABELS[option.unitType] ?? option.unitType}
                </span>
                {option.piecesPerUnit && (
                  <span className="text-gray-500">
                    ({option.piecesPerUnit} adet)
                  </span>
                )}
              </span>
              <span className="font-semibold text-brand-navy">
                {formatPrice(option.price)}
              </span>
            </div>

            {option.bulkTiers && option.bulkTiers.length > 0 && (
              <p className="ml-6 text-xs text-gray-500">
                Toplu alım:{" "}
                {option.bulkTiers
                  .slice()
                  .sort((a, b) => a.minQuantity - b.minQuantity)
                  .map((tier, i) => (
                    <span key={i}>
                      {i > 0 && " · "}
                      {tier.minQuantity}+ adet: {formatPrice(tier.price)}
                    </span>
                  ))}
              </p>
            )}
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center self-start rounded-md border border-gray-300 sm:self-auto">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-10 items-center justify-center text-gray-600 hover:bg-gray-50"
            aria-label="Azalt"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-11 w-10 items-center justify-center text-gray-600 hover:bg-gray-50"
            aria-label="Artır"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          variant="accent"
          size="lg"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="flex-1 gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock
            ? "Stokta Yok"
            : `Sepete Ekle — ${formatPrice(effectiveUnitPrice * quantity)}`}
        </Button>
      </div>

      {isBulkDiscountApplied && (
        <p className="mt-2 text-xs font-medium text-green-600">
          Toplu alım indirimi uygulandı — birim fiyat {formatPrice(effectiveUnitPrice)}
        </p>
      )}
    </div>
  );
}
