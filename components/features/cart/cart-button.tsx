"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-context";

export function CartButton() {
  const { totalItems, setOpen } = useCart();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setOpen(true)}
      className="relative border-gray-300 bg-white text-brand-navy hover:bg-gray-50"
      aria-label="Sepeti aç"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Button>
  );
}
