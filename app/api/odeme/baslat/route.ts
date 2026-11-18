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
import { getProductsByIds, getSiteSettings } from "@/lib/sanity/fetchers";
import { calculateShippingFee } from "@/lib/shipping";
import { isValidProvinceDistrict } from "@/lib/data/tr-locations";
import { getCurrentCustomerSession } from "@/lib/auth/options";
import { findCustomerById } from "@/lib/auth/customers";
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
  district: string;
  address: string;
  /** Opsiyonel: 10 haneli VKN veya 11 haneli TCKN. */
  taxNumber: string;
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
    district: asString(source.district),
    address: asString(source.address),
    taxNumber: asString(source.taxNumber).replace(/\D/g, ""),
  };

  const { taxNumber, ...required } = buyer;
  if (Object.values(required).some((value) => !value)) {
    return { ok: false, error: "Lütfen tüm alanları doldurun." };
  }

  if (!isValidProvinceDistrict(buyer.city, buyer.district)) {
    return { ok: false, error: "Lütfen listeden geçerli bir il ve ilçe seçin." };
  }

  if (taxNumber && taxNumber.length !== 10 && taxNumber.length !== 11) {
    return {
      ok: false,
      error: "Vergi kimlik numarası 10, TC kimlik numarası 11 haneli olmalıdır.",
    };
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
  let siteSettings;
  try {
    [products, siteSettings] = await Promise.all([
      getProductsByIds(
        Array.from(new Set(items.map((item) => item.productId)))
      ),
      getSiteSettings(),
    ]);
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

  // Kargo ücreti de sunucuda, Site Ayarları'ndaki güncel değerle hesaplanır.
  const shippingFee = calculateShippingFee(totals.totalIncludingVat, siteSettings);
  const grandTotal = Math.round((totals.totalIncludingVat + shippingFee) * 100) / 100;

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
  if (shippingFee > 0) {
    basket.push(["Kargo", shippingFee.toFixed(2), 1]);
  }

  let tokenResult;
  try {
    tokenResult = await createPaytrToken(config, {
      userIp,
      merchantOid,
      email: buyer.email,
      paymentAmountKurus: Math.round(grandTotal * 100),
      basket,
      userName: `${buyer.name} ${buyer.surname}`,
      userAddress: `${buyer.address}, ${buyer.district}/${buyer.city}`.slice(0, 400),
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
  // Giriş yapmış üyenin siparişi hesabına bağlanır ("Hesabım → Siparişlerim").
  const session = await getCurrentCustomerSession().catch(() => null);

  const writeClient = getWriteClient();
  if (writeClient) {
    try {
      await writeClient.create({
        _type: "order",
        orderNumber: merchantOid,
        status: "pending",
        ...(session
          ? { customer: { _type: "reference", _ref: session.id, _weak: true } }
          : {}),
        customerName: buyer.name,
        customerSurname: buyer.surname,
        customerEmail: buyer.email,
        customerPhone: buyer.phone,
        customerCity: buyer.city,
        customerDistrict: buyer.district,
        ...(buyer.taxNumber ? { customerTaxNumber: buyer.taxNumber } : {}),
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
        shippingFee,
        grandTotal,
      });
    } catch (error) {
      console.error("Sipariş Sanity'e yazılamadı:", error);
      return NextResponse.json(
        { error: "Siparişiniz kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // Üyenin hesabında kayıtlı telefon/adres yoksa bu siparişteki bilgileri
    // kaydet (bir sonraki siparişte form dolu gelsin). Doluysa dokunma.
    if (session) {
      try {
        const customer = await findCustomerById(session.id);
        if (customer) {
          const missing = Object.fromEntries(
            Object.entries({
              phone: buyer.phone,
              city: buyer.city,
              district: buyer.district,
              address: buyer.address,
              taxNumber: buyer.taxNumber,
            }).filter(([key, value]) => value && !customer[key as keyof typeof customer])
          );
          if (Object.keys(missing).length > 0) {
            await writeClient.patch(customer._id).set(missing).commit();
          }
        }
      } catch (error) {
        console.error("Üye bilgileri güncellenemedi (sipariş etkilenmedi):", error);
      }
    }
  }

  return NextResponse.json({ token: tokenResult.token });
}
