import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import { buildMapEmbedSrc } from "@/lib/maps";
import type { SiteSettings } from "@/lib/sanity/types";

interface SiteFooterProps {
  siteSettings: SiteSettings | null;
}

const LEGAL_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
  { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
];

export function SiteFooter({ siteSettings }: SiteFooterProps) {
  const address = siteSettings?.address || SITE_CONFIG.address;
  const phone = siteSettings?.phone || SITE_CONFIG.phone;
  const email = siteSettings?.email || SITE_CONFIG.email;
  const mapSrc = buildMapEmbedSrc(siteSettings);

  return (
    <footer className="border-t border-gray-200 bg-brand-navy-dark text-sm text-white/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <p className="text-base font-semibold text-white">
            {SITE_CONFIG.name}
          </p>
          <p className="mt-2">{address}</p>
          <p className="mt-1">
            {phone}
            {email ? ` · ${email}` : ""}
          </p>

          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/60 hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="mt-6 text-xs text-white/40">
            © {new Date().getFullYear()} {SITE_CONFIG.name}. Tüm hakları
            saklıdır.
          </p>
        </div>

        {mapSrc && (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <iframe
              src={mapSrc}
              title="İşyeri Konumu"
              width="100%"
              height="220"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </footer>
  );
}
