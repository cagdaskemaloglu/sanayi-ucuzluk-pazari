"use client";

import { Truck } from "lucide-react";
import { getShippingDay } from "@/lib/delivery";
import { useStoreSettings } from "@/lib/store/store-settings";
import { cn } from "@/lib/utils";

// "Bugün kargoda" / "Yarın kargoda" rozeti. Saat ziyaretçinin tarayıcısında
// (Türkiye saatine çevrilerek) hesaplanır; sunucu ile tarayıcı arasında
// kesim saatine denk gelen anlarda metin farklı olabileceği için
// suppressHydrationWarning kullanılır.
export function ShippingDayBadge({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const { delivery } = useStoreSettings();
  const { daysFromToday, label } = getShippingDay(delivery);

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        daysFromToday === 0 ? "text-green-700" : "text-gray-600",
        size === "sm" ? "text-[11px]" : "text-sm",
        className
      )}
    >
      <Truck className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span suppressHydrationWarning>{label}</span>
    </span>
  );
}
