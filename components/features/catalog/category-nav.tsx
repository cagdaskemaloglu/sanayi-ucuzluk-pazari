import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/sanity/types";

interface CategoryNavProps {
  categories: Category[];
  /** Aktif kategori slug'ı — anasayfadaysak (Tümü) undefined geçilir. */
  activeCategory?: string;
}

const pillBase =
  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors";
const pillActive = "border-brand-navy bg-brand-navy text-white";
const pillInactive =
  "border-gray-300 bg-white text-gray-700 hover:border-brand-navy hover:text-brand-navy";

const subPillBase =
  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors";
const subPillActive = "border-brand-navy bg-brand-navy/10 text-brand-navy";
const subPillInactive =
  "border-gray-200 bg-white text-gray-600 hover:border-brand-navy hover:text-brand-navy";

// Üst satır: ana kategoriler. Bir ana kategori (veya onun alt kategorisi)
// açıkken ikinci satırda o ana kategorinin alt kategorileri gösterilir.
export function CategoryNav({ categories, activeCategory }: CategoryNavProps) {
  const active = categories.find((category) => category.slug === activeCategory);
  const activeRootSlug = active?.parent?.slug ?? active?.slug;

  const rootCategories = categories.filter((category) => !category.parent);
  const subCategories = activeRootSlug
    ? categories.filter((category) => category.parent?.slug === activeRootSlug)
    : [];

  return (
    <nav className="sticky top-16 z-30 border-b border-gray-200 bg-white">
      <div className="scrollbar-hide mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
        <Link
          href="/"
          className={cn(pillBase, !activeCategory ? pillActive : pillInactive)}
        >
          Tümü
        </Link>
        {rootCategories.map((category) => (
          <Link
            key={category._id}
            href={`/kategori/${category.slug}`}
            className={cn(
              pillBase,
              activeRootSlug === category.slug ? pillActive : pillInactive
            )}
          >
            {category.title}
          </Link>
        ))}
      </div>

      {subCategories.length > 0 && (
        <div className="scrollbar-hide mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          <Link
            href={`/kategori/${activeRootSlug}`}
            className={cn(
              subPillBase,
              activeCategory === activeRootSlug ? subPillActive : subPillInactive
            )}
          >
            Tümü
          </Link>
          {subCategories.map((category) => (
            <Link
              key={category._id}
              href={`/kategori/${category.slug}`}
              className={cn(
                subPillBase,
                activeCategory === category.slug ? subPillActive : subPillInactive
              )}
            >
              {category.title}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
