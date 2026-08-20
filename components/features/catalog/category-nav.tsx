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

// Her kategori artık kendi gerçek URL'ine sahip (/kategori/[slug]) —
// hem SEO hem paylaşılabilir linkler için, eski ?category= filtresi
// yerine. "Tümü" anasayfaya (/) gider.
export function CategoryNav({ categories, activeCategory }: CategoryNavProps) {
  return (
    <nav className="sticky top-16 z-30 border-b border-gray-200 bg-white">
      <div className="scrollbar-hide mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
        <Link
          href="/"
          className={cn(pillBase, !activeCategory ? pillActive : pillInactive)}
        >
          Tümü
        </Link>
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/kategori/${category.slug}`}
            className={cn(
              pillBase,
              activeCategory === category.slug ? pillActive : pillInactive
            )}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
