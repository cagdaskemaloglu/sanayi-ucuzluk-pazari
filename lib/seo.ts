import { SITE_CONFIG } from "@/lib/constants";
import { UNIT_LABELS, getAmountIncludingVat } from "@/lib/pricing";
import type { PricingOption, SiteSettings } from "@/lib/sanity/types";

export function absoluteUrl(path = "/"): string {
  return `${SITE_CONFIG.url}${path === "/" ? "" : path}`;
}

/**
 * JSON-LD'yi <script> içine güvenle gömmek için serileştirir. Sanity'den
 * gelen metinde "</script>" geçse bile etiketi kapatamasın diye "<"
 * karakteri kaçışlanır.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** 2 haneye yuvarlanmış, KDV dahil fiyat. */
export function priceIncludingVat(price: number, vatRate?: number): number {
  return Math.round(getAmountIncludingVat(price, vatRate) * 100) / 100;
}

/**
 * Google'a (yapısal veri + Merchant feed) bildirilen temsili satış birimi.
 * Ürün sayfasında varsayılan olarak seçili gelen ilk birimle aynı olmalı ki
 * Google'ın gördüğü fiyat sayfadaki fiyatla eşleşsin.
 */
export function getPrimaryPricingOption(
  pricingOptions?: PricingOption[]
): PricingOption | undefined {
  return pricingOptions?.[0];
}

/** "Koli (30 adet)" gibi okunabilir birim etiketi; adet için boş döner. */
export function unitSuffix(option?: PricingOption): string {
  if (!option || option.unitType === "adet") return "";
  const label = UNIT_LABELS[option.unitType] ?? option.unitType;
  return option.piecesPerUnit ? `${label} (${option.piecesPerUnit} adet)` : label;
}

/** Meta description için metni ~160 karaktere, kelime ortasından bölmeden kısaltır. */
export function truncateDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export const DEFAULT_RETURN_DAYS = 14;

/**
 * schema.org kargo bilgisi. Sanity Site Ayarları'nda kargo ücreti
 * girilmediyse undefined döner (Google'a yanlış bilgi vermemek için) —
 * bu durumda kargo ayarları doğrudan Merchant Center'dan yapılır.
 */
export function buildShippingDetails(
  siteSettings: SiteSettings | null | undefined,
  orderPrice: number
) {
  const fee = siteSettings?.shippingFee;
  if (fee === undefined || fee === null) return undefined;

  const threshold = siteSettings?.freeShippingThreshold;
  const isFree = fee === 0 || (threshold !== undefined && threshold !== null && orderPrice >= threshold);

  const minDays = siteSettings?.deliveryMinDays;
  const maxDays = siteSettings?.deliveryMaxDays;

  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: isFree ? 0 : fee,
      currency: "TRY",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "TR",
    },
    ...(minDays !== undefined && maxDays !== undefined
      ? {
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 1,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "QuantitativeValue",
              minValue: minDays,
              maxValue: maxDays,
              unitCode: "DAY",
            },
          },
        }
      : {}),
  };
}

export function buildReturnPolicy(siteSettings: SiteSettings | null | undefined) {
  const days = siteSettings?.returnDays ?? DEFAULT_RETURN_DAYS;
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "TR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: days,
    returnMethod: "https://schema.org/ReturnByMail",
    ...(siteSettings?.freeReturns !== undefined
      ? {
          returnFees: siteSettings.freeReturns
            ? "https://schema.org/FreeReturn"
            : "https://schema.org/ReturnShippingFees",
        }
      : {}),
    merchantReturnLink: absoluteUrl("/iade-ve-kargo"),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Açıklaması girilmemiş ürünler için yedek metin. Google, ürün yapısal
 * verisinde "description" alanını istiyor; boş kalırsa Search Console uyarır.
 */
export function productDescriptionFallback(
  productName: string,
  categoryTitle?: string
): string {
  return `${productName} — ${categoryTitle ?? "Sanayi ve hırdavat"} kategorisinde toptan ve perakende satış. Adet, kutu ve koli seçenekleriyle uygun fiyat.`;
}
