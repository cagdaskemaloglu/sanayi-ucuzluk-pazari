import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import type { SiteSettings } from "@/lib/sanity/types";

interface TopContactBarProps {
  siteSettings: SiteSettings | null;
}

// Header'ın hemen üstünde, sticky OLMAYAN ince bir bilgi çubuğu —
// sayfa aşağı kaydırılınca sıradan akışla birlikte kaybolur, sticky
// header eskisi gibi en üstte kalmaya devam eder.
export function TopContactBar({ siteSettings }: TopContactBarProps) {
  const email = siteSettings?.email || SITE_CONFIG.email;
  const phone = siteSettings?.phone || SITE_CONFIG.phone;
  const address = siteSettings?.address || SITE_CONFIG.address;
  const instagramUrl = siteSettings?.instagramUrl;

  // Hiçbiri yoksa çubuğu hiç gösterme.
  if (!email && !phone && !address && !instagramUrl) {
    return null;
  }

  return (
    <div style={{ backgroundColor: "#150136" }} className="w-full text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-1.5 text-xs">
        {email && (
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {email}
          </span>
        )}
        {phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {phone}
          </span>
        )}
        {address && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {address}
          </span>
        )}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex items-center gap-1.5 transition-colors hover:text-brand-accent"
          >
            <Instagram className="h-3.5 w-3.5 shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}
