"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { UNIT_LABELS, formatPrice, getEffectiveUnitPrice } from "@/lib/pricing";
import type { PricingOption } from "@/lib/sanity/types";

interface AddToCartPopoverProps {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  pricingOptions: PricingOption[];
  isOutOfStock: boolean;
}

// Trigger buton stilini doğrudan burada tanımlıyoruz (Button bileşenini
// Radix'in asChild/Slot mekanizmasıyla sarmalamak yerine) — böylece
// event handler birleştirmeyle ilgili olası çakışmalar tamamen ortadan
// kalkıyor, tetikleyici PopoverTrigger'ın kendi native <button>'ı olur.
const triggerClassName =
  "mt-auto inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-brand-accent px-3 h-9 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

// Ürün kartındaki "Sepete Ekle" butonu — tıklanınca hangi satış biriminden
// (adet/kutu/koli/palet) kaç adet eklenmek istendiğini soran küçük bir
// popover açar. Ürün detay sayfasındaki seçiciyle aynı mantık, sadece
// kart genişliğine sığacak kompakt bir sürümü.
export function AddToCartPopover({
  productId,
  productSlug,
  productName,
  imageUrl,
  pricingOptions,
  isOutOfStock,
}: AddToCartPopoverProps) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const selected = pricingOptions[selectedIndex];

  function handleConfirm() {
    if (!selected) return;
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
      quantity,
    });
    setOpen(false);
    setQuantity(1);
  }

  if (isOutOfStock) {
    return (
      <button type="button" disabled className={triggerClassName}>
        <ShoppingCart className="h-3.5 w-3.5" />
        Stokta Yok
      </button>
    );
  }

  if (!pricingOptions?.length) {
    return null;
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuantity(1);
      }}
    >
      <PopoverTrigger type="button" className={triggerClassName}>
        <ShoppingCart className="h-3.5 w-3.5" />
        Sepete Ekle
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="text-xs font-medium text-gray-700">Birim Seç</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {pricingOptions.map((option, index) => (
            <label
              key={index}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                selectedIndex === index
                  ? "border-brand-navy bg-brand-navy/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <span className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`unit-${productId}`}
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  className="h-3.5 w-3.5 accent-brand-navy"
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
            </label>
          ))}
        </div>

        {selected?.bulkTiers && selected.bulkTiers.length > 0 && (
          <p className="mt-2 text-[11px] text-gray-500">
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

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50"
              aria-label="Azalt"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50"
              aria-label="Artır"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="accent"
            size="sm"
            onClick={handleConfirm}
            className="flex-1"
          >
            Ekle — {selected ? formatPrice(getEffectiveUnitPrice(selected.price, quantity, selected.bulkTiers) * quantity) : ""}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
