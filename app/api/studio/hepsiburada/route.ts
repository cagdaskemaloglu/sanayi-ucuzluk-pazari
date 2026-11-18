import { NextResponse } from "next/server";
import {
  isAllowedImageUrl,
  parseHepsiburadaHtml,
  parseHepsiburadaUrl,
} from "@/lib/import/hepsiburada";

// Sanity Studio'daki "Hepsiburada'dan Doldur" butonunun arka ucu.
//  POST { url }        → ürün sayfasını çekip ayıklanmış bilgileri döner
//  GET  ?image=<url>   → görseli Studio'ya aktarır (tarayıcı doğrudan
//                         Hepsiburada görsel sunucusundan çekemiyor - CORS)
// Hiçbir şeyi kaydetmez; kaydı Studio, giriş yapmış kullanıcının yetkisiyle
// yapar. Yalnızca Hepsiburada adreslerine istek atar (yönlendirmeler dahil
// her adımda kontrol edilir) — başka sitelere vekil olarak kullanılamaz.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
};
const MAX_PAGE_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function fetchWithAllowedRedirects(
  start: URL,
  isAllowed: (url: string) => boolean,
  accept: string
): Promise<Response> {
  let current = start.toString();
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(current, {
      headers: { ...BROWSER_HEADERS, Accept: accept },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return response;
      const next = new URL(location, current).toString();
      if (!isAllowed(next)) throw new Error("redirect-not-allowed");
      current = next;
      continue;
    }
    return response;
  }
  throw new Error("too-many-redirects");
}

async function readLimited(response: Response, limit: number): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error("too-large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Bu istek yalnızca Studio'dan yapılabilir." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? parseHepsiburadaUrl(body.url) : null;
  if (!url) {
    return NextResponse.json(
      { error: "Lütfen geçerli bir Hepsiburada ürün linki yapıştırın (https://www.hepsiburada.com/...)." },
      { status: 400 }
    );
  }

  let html: string;
  try {
    const response = await fetchWithAllowedRedirects(
      url,
      (next) => parseHepsiburadaUrl(next) !== null,
      "text/html,application/xhtml+xml"
    );
    if (response.status === 403 || response.status === 429 || response.status === 503) {
      console.warn("Hepsiburada isteği engelledi:", response.status, url.pathname);
      return NextResponse.json(
        { error: "Hepsiburada bu isteği engelledi (bot koruması). Biraz sonra tekrar deneyin veya bilgileri elle girin." },
        { status: 502 }
      );
    }
    if (!response.ok) {
      return NextResponse.json(
        { error: `Ürün sayfası açılamadı (Hepsiburada ${response.status} döndü). Linki kontrol edin.` },
        { status: 502 }
      );
    }
    html = new TextDecoder("utf-8").decode(await readLimited(response, MAX_PAGE_BYTES));
  } catch (error) {
    console.error("Hepsiburada sayfası çekilemedi:", url.pathname, error);
    return NextResponse.json(
      { error: "Hepsiburada'ya ulaşılamadı veya yanıt çok geç geldi. Tekrar deneyin veya bilgileri elle girin." },
      { status: 502 }
    );
  }

  const product = parseHepsiburadaHtml(html);
  if (!product.name && product.images.length === 0) {
    return NextResponse.json(
      { error: "Sayfada ürün bilgisi bulunamadı. Linkin bir ürün sayfası olduğundan emin olun; Hepsiburada sayfa yapısını değiştirmiş veya isteği engellemiş olabilir." },
      { status: 422 }
    );
  }
  return NextResponse.json({ product });
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const image = new URL(request.url).searchParams.get("image") ?? "";
  if (!isAllowedImageUrl(image)) {
    return NextResponse.json({ error: "invalid image url" }, { status: 400 });
  }
  try {
    const response = await fetchWithAllowedRedirects(new URL(image), isAllowedImageUrl, "image/*");
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) {
      return NextResponse.json({ error: "image not available" }, { status: 502 });
    }
    const bytes = await readLimited(response, MAX_IMAGE_BYTES);
    return new Response(new Blob([bytes as BlobPart]), {
      headers: { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    console.error("Hepsiburada görseli çekilemedi:", error);
    return NextResponse.json({ error: "image fetch failed" }, { status: 502 });
  }
}
