import { SITE_CONFIG } from "./constants";
import type { SiteSettings } from "./sanity/types";

export function buildMapEmbedSrc(siteSettings: SiteSettings | null): string | null {
  if (siteSettings?.googleMapsEmbedUrl) {
    return siteSettings.googleMapsEmbedUrl;
  }
  const address = siteSettings?.address || SITE_CONFIG.address;
  if (!address) return null;
  // Embed API anahtarı gerektirmeyen basit Google Maps embed formatı.
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}
