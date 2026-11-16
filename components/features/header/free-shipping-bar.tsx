import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import type { SiteSettings } from "@/lib/sanity/types";

// En üstteki iletişim çubuğunun hemen altında ücretsiz kargo bildirimi.
// Değerler Sanity → Site Ayarları'ndan (Kargo Ücreti ve Ücretsiz Kargo Alt
// Limiti) gelir; kargo ücreti girilmemişse şerit gösterilmez.
export function FreeShippingBar({ siteSettings }: { siteSettings: SiteSettings | null }) {
  const fee = siteSettings?.shippingFee;
  const threshold = siteSettings?.freeShippingThreshold;

  let message: string | null = null;
  if (fee === 0) {
    message = "Tüm siparişlerde kargo ücretsiz!";
  } else if (typeof fee === "number" && fee > 0 && typeof threshold === "number" && threshold > 0) {
    message = `${formatPrice(threshold)} ve üzeri siparişlerde kargo ücretsiz!`;
  }

  if (!message) return null;

  return (
    <div className="w-full bg-brand-accent text-brand-navy-dark">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-semibold sm:text-sm">
        <Truck className="h-4 w-4 shrink-0" />
        {message}
      </p>
    </div>
  );
}
