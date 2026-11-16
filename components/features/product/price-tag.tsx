import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// Fiyat gösterimi: indirim varsa eski fiyat üstü çizili, yeni fiyat vurgulu.
export function PriceTag({
  price,
  originalPrice,
  className,
  priceClassName,
}: {
  price: number;
  originalPrice?: number;
  className?: string;
  priceClassName?: string;
}) {
  const discounted = originalPrice !== undefined && originalPrice > price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline justify-end gap-x-1.5", className)}>
      {discounted && (
        <span className="text-[0.85em] font-normal text-gray-400 line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
      <span
        className={cn(
          "font-semibold",
          discounted ? "text-red-600" : "text-brand-navy",
          priceClassName
        )}
      >
        {formatPrice(price)}
      </span>
    </span>
  );
}
