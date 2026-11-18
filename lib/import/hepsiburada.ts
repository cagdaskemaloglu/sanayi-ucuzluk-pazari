// Hepsiburada ürün sayfasından ürün bilgisi ayıklama (Studio'daki "Bilgileri
// Çek" butonu için). Önce sayfadaki schema.org Product yapısal verisi
// (JSON-LD), yoksa Open Graph etiketleri okunur. Fiyat bilinçli olarak
// alınmaz: sitedeki fiyatlar KDV hariç ve adet başı, mağazanın kendi fiyatı.

export interface ImportedProduct {
  name?: string;
  description?: string;
  brand?: string;
  gtin?: string;
  mpn?: string;
  images: string[];
}

const ALLOWED_PAGE_HOSTS = new Set(["www.hepsiburada.com", "hepsiburada.com"]);
const ALLOWED_IMAGE_HOST_SUFFIX = ".hepsiburada.net";

/** Yalnızca https://(www.)hepsiburada.com/... ürün sayfası adreslerini kabul eder. */
export function parseHepsiburadaUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || !ALLOWED_PAGE_HOSTS.has(url.hostname)) return null;
    if (url.username || url.password || (url.port && url.port !== "443")) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

export function isAllowedImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(ALLOWED_IMAGE_HOST_SUFFIX) &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443")
    );
  } catch {
    return false;
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** HTML'i düz metne çevirir (paragraf/satır sonlarını korur). */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
      .replace(/<\s*li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function normalizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // Hepsiburada görsel adreslerinde boyut yer tutucusu olabilir.
  const url = raw.replace(/\{size\}/gi, "1500").replace(/^\/\//, "https://");
  return isAllowedImageUrl(url) ? url : null;
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function findProductNode(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductNode(item);
      if (found) return found;
    }
    return null;
  }
  const record = node as Record<string, unknown>;
  const type = record["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return record;
  if (record["@graph"]) return findProductNode(record["@graph"]);
  return null;
}

function metaContent(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  );
  const match = html.match(re);
  const value = match?.[1] ?? match?.[2];
  return value ? decodeEntities(value).trim() : undefined;
}

const GTIN_KEYS = ["gtin13", "gtin", "gtin12", "gtin14", "gtin8"];

export function parseHepsiburadaHtml(html: string): ImportedProduct {
  const result: ImportedProduct = { images: [] };

  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const [, json] of scripts) {
    let data: unknown;
    try {
      data = JSON.parse(json.trim());
    } catch {
      continue;
    }
    const product = findProductNode(data);
    if (!product) continue;

    if (typeof product.name === "string") result.name = decodeEntities(product.name).trim();
    if (typeof product.description === "string") result.description = htmlToText(product.description);
    const brand = product.brand as { name?: unknown } | string | undefined;
    const brandName = typeof brand === "string" ? brand : brand?.name;
    if (typeof brandName === "string") result.brand = decodeEntities(brandName).trim();
    for (const key of GTIN_KEYS) {
      const value = String(product[key] ?? "").replace(/\D/g, "");
      if (/^(\d{8}|\d{12,14})$/.test(value)) {
        result.gtin = value;
        break;
      }
    }
    if (typeof product.mpn === "string" && product.mpn.trim()) result.mpn = product.mpn.trim();
    for (const image of asArray(product.image as unknown)) {
      const url = normalizeImageUrl(
        typeof image === "object" && image ? (image as { url?: unknown }).url : image
      );
      if (url && !result.images.includes(url)) result.images.push(url);
    }
    break;
  }

  // Yapısal veri yoksa / eksikse Open Graph etiketlerine düş.
  result.name ||= metaContent(html, "og:title")?.replace(/\s*[-|]\s*Hepsiburada.*$/i, "");
  result.description ||= metaContent(html, "og:description");
  if (result.images.length === 0) {
    const ogImage = normalizeImageUrl(metaContent(html, "og:image"));
    if (ogImage) result.images.push(ogImage);
  }

  result.images = result.images.slice(0, 8);
  if (result.description) result.description = result.description.slice(0, 5000);
  if (result.name) result.name = result.name.slice(0, 200);
  return result;
}

/** Türkçe karakterleri dönüştürerek URL uyumlu slug üretir. */
export function slugifyTr(text: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıiöşüâîû]/g, (char) => map[char] ?? char)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
