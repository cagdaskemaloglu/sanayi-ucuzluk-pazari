import Image from "next/image";
import Link from "next/link";
import { CartButton } from "@/components/features/cart/cart-button";
import { SITE_CONFIG } from "@/lib/constants";
import { urlForImage } from "@/lib/sanity/image";
import type { SiteSettings } from "@/lib/sanity/types";

interface SiteHeaderProps {
  siteSettings: SiteSettings | null;
}

export function SiteHeader({ siteSettings }: SiteHeaderProps) {
  const title = siteSettings?.siteTitle || SITE_CONFIG.name;
  // Varsayılan (Studio'da renk girilmediyse) artık koyu lacivert —
  // header arka planı beyaza döndüğü için beyaz metin yerine bu kullanılıyor.
  const titleColor = siteSettings?.siteTitleColor || undefined;
  const description = siteSettings?.siteDescription;
  const descriptionColor = siteSettings?.siteDescriptionColor || undefined;
  const iconUrl = siteSettings?.siteIcon
    ? urlForImage(siteSettings.siteIcon).width(64).height(64).url()
    : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        {/* min-w-0 + truncate: dar ekranlarda uzun site adı/açıklama
            sepet ikonunun üzerine binmeden kesilir (...) */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          {iconUrl && (
            <Image
              src={iconUrl}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded object-contain"
            />
          )}
          <span className="flex min-w-0 flex-col justify-center">
            <span
              className="truncate text-base font-bold leading-tight tracking-tight text-brand-navy sm:text-lg"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {title}
            </span>
            {description && (
              <span
                className="hidden truncate text-xs font-normal leading-tight text-gray-500 sm:block"
                style={descriptionColor ? { color: descriptionColor } : undefined}
              >
                {description}
              </span>
            )}
          </span>
        </Link>
        <div className="shrink-0">
          <CartButton />
        </div>
      </div>
    </header>
  );
}
