import { NextRequest, NextResponse } from "next/server";
import {
  createPaytrToken,
  generateMerchantOid,
  getPaytrConfig,
  type BasketLine,
} from "@/lib/paytr/client";
import { resolveUserIp } from "@/lib/paytr/user-ip";
import {
  computeCheckoutLines,
  type CheckoutItemInput,
} from "@/lib/checkout/compute-lines";
import { getProductsByIds } from "@/lib/sanity/fetchers";
import { getWriteClient } from "@/lib/sanity/write-client";
import { SITE_CONFIG } from "@/lib/constants";

// Her istek anlık işlensin, önbelleğe alınmasın.
export const dynamic = "force-dynamic";

interface BuyerInput {
  name: string;
  surname: string;
  email: string;
  phone: string;
  city: string;
  address: string;
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseBuyer(raw: unknown): Parsed<BuyerInput> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Lütfen tüm alanları doldurun." };
  }

  const source = raw as Record<string, unknown>;
  const buyer: BuyerInput = {
    name: asString(source.name),
    surname: asString(source.surname),
    email: asString(source.email),
    phone: asString(source.phone).replace(/[\s()-]/g, ""),
    city: asString(source.city),
    address: asString(source.address),
  };

  if (Object.values(buyer).some((value) => !value)) {
    return { ok: false, error: "Lütfen tüm alanları doldurun." };
  }

  // PayTR kuralı: e-posta en fazla 100 karakter ve Türkçe karakter içermemeli.
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email);
  const emailIsAscii = /^[\x20-\x7E]+$/.test(buyer.email);
  if (!emailLooksValid || !emailIsAscii || buyer.email.length > 100) {
    return {
      ok: false,
      error:
        "Lütfen geçerli bir e-posta adresi girin (Türkçe karakter içermemeli).",
    };
  }

  if (!/^\+?\d{10,15}$/.test(buyer.phone)) {
    return { ok: false, error: "Lütfen geçerli bir telefon numarası girin." };
  }

  if (`${buyer.name} ${buyer.surname}`.length > 60) {
    return { ok: false, error: "Ad ve soyad toplamda 60 karakteri aşamaz." };
  }

  return { ok: true, value: buyer };
}

function parseItems(raw: unknown): CheckoutItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) {
    return null;
  }

  const items: CheckoutItemInput[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.productId !== "string" ||
      typeof candidate.unitType !== "string" ||
      typeof candidate.quantity !== "number"
    ) {
      return null;
    }
    items.push({
      productId: candidate.productId,
      unitType: candidate.unitType,
      quantity: candidate.quantity,
    });
  }
  return items;
}

export async function POST(request: NextRequest) {
  const config = getPaytrConfig();

  if (!config) {
    return NextResponse.json(
      {
        error:
          "Online ödeme sistemi henüz yapılandırılmadı. Lütfen WhatsApp üzerinden sipariş verin veya daha sonra tekrar deneyin.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const payload = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;

  const buyerResult = parseBuyer(payload.buyer);
  if (!buyerResult.ok) {
    return NextResponse.json({ error: buyerResult.error }, { status: 400 });
  }
  const buyer = buyerResult.value;

  const items = parseItems(payload.items);
  if (!items) {
    return NextResponse.json(
      { error: "Sepetiniz boş veya geçersiz." },
      { status: 400 }
    );
  }

  // Fiyatı tarayıcıdan değil, Sanity'deki güncel veriden sunucuda hesaplıyoruz.
  let products;
  try {
    products = await getProductsByIds(
      Array.from(new Set(items.map((item) => item.productId)))
    );
  } catch (error) {
    console.error("Ürünler Sanity'den okunamadı:", error);
    return NextResponse.json(
      { error: "Ürün bilgileri alınamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  const checkout = computeCheckoutLines(items, products);
  if (!checkout.ok) {
    return NextResponse.json({ error: checkout.error }, { status: 400 });
  }
  const { lines, totals } = checkout;

  const userIp = await resolveUserIp(request);
  if (!userIp) {
    return NextResponse.json(
      { error: "IP adresiniz belirlenemedi. Lütfen tekrar deneyin." },
      { status: 400 }
    );
  }

  const merchantOid = generateMerchantOid();

  // Her satırı "adet 1" olarak, satır toplamıyla gönderiyoruz: böylece
  // birim fiyat yuvarlamasından kaynaklı kuruş farkları oluşmaz.
  const basket: BasketLine[] = lines.map((line) => [
    `${line.productName} (${line.unitLabel} x ${line.quantity})`.slice(0, 100),
    line.lineTotalIncludingVat.toFixed(2),
    1,
  ]);

  let tokenResult;
  try {
    tokenResult = await createPaytrToken(config, {
      userIp,
      merchantOid,
      email: buyer.email,
      paymentAmountKurus: Math.round(totals.totalIncludingVat * 100),
      basket,
      userName: `${buyer.name} ${buyer.surname}`,
      userAddress: `${buyer.address}, ${buyer.city}`.slice(0, 400),
      userPhone: buyer.phone,
      okUrl: `${SITE_CONFIG.url}/odeme/basarili`,
      failUrl: `${SITE_CONFIG.url}/odeme/basarisiz`,
    });
  } catch (error) {
    console.error("PayTR'a ulaşılamadı:", error);
    return NextResponse.json(
      { error: "Ödeme servisine ulaşılamadı. Lütfen tekrar deneyin." },
      { status: 502 }
    );
  }

  if (!tokenResult.ok) {
    console.error("PayTR get-token başarısız:", tokenResult.reason);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Ödeme başlatılamadı. Lütfen tekrar deneyin."
            : `Ödeme başlatılamadı (PayTR): ${tokenResult.reason}`,
      },
      { status: 502 }
    );
  }

  // Sipariş kaydını "Beklemede" olarak Sanity'e yaz. SANITY_API_TOKEN hiç
  // tanımlı değilse kayıt atlanır (geliştirme kolaylığı); tanımlı olduğu
  // halde yazılamıyorsa ödeme BAŞLATILMAZ — kayıtsız para tahsil etmeyelim.
  const writeClient = getWriteClient();
  if (writeClient) {
    try {
      await writeClient.create({
        _type: "order",
        orderNumber: merchantOid,
        status: "pending",
        customerName: buyer.name,
        customerSurname: buyer.surname,
        customerEmail: buyer.email,
        customerPhone: buyer.phone,
        customerCity: buyer.city,
        customerAddress: buyer.address,
        items: lines.map((line, index) => ({
          _type: "orderItem",
          _key: `line-${index}`,
          productName: line.productName,
          unitLabel: line.unitLabel,
          quantity: line.quantity,
          unitPrice: line.unitPriceIncludingVat,
          lineTotal: line.lineTotalIncludingVat,
        })),
        totalExcludingVat: totals.totalExcludingVat,
        totalVat: totals.totalVat,
        totalIncludingVat: totals.totalIncludingVat,
      });
    } catch (error) {
      console.error("Sipariş Sanity'e yazılamadı:", error);
      return NextResponse.json(
        { error: "Siparişiniz kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ token: tokenResult.token });
}
