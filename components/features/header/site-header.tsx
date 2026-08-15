import Link from "next/link";
import { CartButton } from "@/components/features/cart/cart-button";
import { SITE_CONFIG } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-brand-navy text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        {/* min-w-0 + truncate: dar ekranlarda uzun site adı sepet
            ikonunun üzerine binmeden kesilir (...) */}
        <Link
          href="/"
          className="min-w-0 truncate text-base font-bold tracking-tight sm:text-lg"
        >
          {SITE_CONFIG.name}
        </Link>
        <div className="shrink-0">
          <CartButton />
        </div>
      </div>
    </header>
  );
}
