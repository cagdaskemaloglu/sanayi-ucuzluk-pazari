"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { QuantityInput } from "@/components/ui/quantity-input";
import { PriceTag } from "@/components/features/product/price-tag";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import {
  UNIT_LABELS,
  formatPrice,
  getEffectiveUnitPrice,
  piecesInUnit,
} from "@/lib/pricing";
import type { PricingOption } from "@/lib/sanity/types";

interface CardPurchasePanelProps {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  pricingOptions: PricingOption[];
  isOutOfStock: boolean;
  vatRate?: number;
}

const buttonClassName =
  "inline-flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-brand-navy-dark px-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

// Ürün kartının alt kısmı: birim seçimi (adet/kutu/koli/palet), fiyatlar
// (indirim varsa eski fiyat üstü çizili), miktar ve "Sepete Ekle".
// Eskiden butona basınca açılan bir pencerede idi; artık kartta sabit.
export function CardPurchasePanel({
  productId,
  productSlug,
  productName,
  imageUrl,
  pricingOptions,
  isOutOfStock,
  vatRate,
}: CardPurchasePanelProps) {
  const { addItem } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const selected = pricingOptions[selectedIndex];

  if (!pricingOptions?.length) return null;

  const effectiveUnitPrice = selected
    ? getEffectiveUnitPrice(selected.price, quantity, selected.bulkTiers)
    : 0;

  function handleAdd() {
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
    <div className="mt-auto flex flex-col gap-2">
      <div className="flex flex-col gap-1" role="radiogroup" aria-label="Birim seç">
        {pricingOptions.map((option, index) => {
          const pieces = piecesInUnit(option);
          const isSelected = selectedIndex === index;
          return (
            <label
              key={index}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors",
                isSelected
                  ? "border-brand-navy bg-brand-navy/5"
                  : "border-gray-200 hover:border-gray-300",
                isOutOfStock && "cursor-default opacity-60"
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <input
                  type="radio"
                  name={`unit-${productId}`}
                  checked={isSelected}
                  disabled={isOutOfStock}
                  onChange={() => setSelectedIndex(index)}
                  className="h-3.5 w-3.5 shrink-0 accent-brand-navy"
                />
                <span className="truncate">
                  <span className="font-medium text-gray-800">
                    {UNIT_LABELS[option.unitType] ?? option.unitType}
                  </span>
                  {pieces > 1 && <span className="text-gray-500"> ({pieces})</span>}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end leading-tight">
                <PriceTag price={option.price} originalPrice={option.originalPrice} />
                {pieces > 1 && option.piecePrice !== undefined && (
                  <span className="text-[10px] text-gray-500">
                    adet {formatPrice(option.piecePrice)}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {selected?.bulkTiers && selected.bulkTiers.length > 0 && (
        <p className="text-[11px] text-gray-500">
          Toplu alım:{" "}
          {selected.bulkTiers
            .slice()
            .sort((a, b) => a.minQuantity - b.minQuantity)
            .map((tier, i) => (
              <span key={i}>
                {i > 0 && " · "}
                {tier.minQuantity}+: {formatPrice(tier.price)}
              </span>
            ))}
        </p>
      )}

      {isOutOfStock ? (
        <button type="button" disabled className={buttonClassName}>
          <ShoppingCart className="h-3.5 w-3.5" />
          Stokta Yok
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            className="shrink-0 rounded-md border border-gray-300"
            buttonClassName="flex h-9 w-7 items-center justify-center text-gray-600 hover:bg-gray-50"
            inputClassName="h-9 w-10"
            iconClassName="h-3.5 w-3.5"
          />
          <button
            type="button"
            onClick={handleAdd}
            className={buttonClassName}
            aria-label={`${productName} sepete ekle — ${formatPrice(effectiveUnitPrice * quantity)}`}
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
            Ekle
          </button>
        </div>
      )}
    </div>
  );
}
