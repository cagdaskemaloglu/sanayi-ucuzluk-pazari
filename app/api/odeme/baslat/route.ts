import { NextRequest, NextResponse } from "next/server";
import { getIyzipayClient, iyzicoRequest } from "@/lib/iyzico/client";
import { getWriteClient } from "@/lib/sanity/write-client";
import { SITE_CONFIG } from "@/lib/constants";

// Her istek anlık işlensin, önbelleğe alınmasın.
export const dynamic = "force-dynamic";

interface CheckoutBuyer {
  name: string;
  surname: string;
  email: string;
  phone: string;
  identityNumber: string;
  city: string;
  address: string;
}

interface CheckoutItem {
  productId: string;
  productName: string;
  unitLabel: string;
  quantity: number;
  lineTotalIncludingVat: number;
}

interface CheckoutRequestBody {
  buyer: CheckoutBuyer;
  items: CheckoutItem[];
  totalExcludingVat: number;
  totalVat: number;
  totalPriceIncludingVat: number;
}

export async function POST(request: NextRequest) {
  const iyzipay = getIyzipayClient();

  if (!iyzipay) {
    return NextResponse.json(
      {
        error:
          "Online ödeme sistemi henüz yapılandırılmadı. Lütfen WhatsApp üzerinden sipariş verin veya daha sonra tekrar deneyin.",
      },
      { status: 503 }
    );
  }

  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.items?.length || !body.totalPriceIncludingVat) {
    return NextResponse.json({ error: "Sepetiniz boş." }, { status: 400 });
  }

  const { buyer } = body;
  if (
    !buyer?.name ||
    !buyer.surname ||
    !buyer.email ||
    !buyer.phone ||
    !buyer.identityNumber ||
    !buyer.city ||
    !buyer.address
  ) {
    return NextResponse.json(
      { error: "Lütfen tüm alanları doldurun." },
      { status: 400 }
    );
  }

  const conversationId = `sup-${Date.now()}`;
  const priceStr = body.totalPriceIncludingVat.toFixed(2);

  // Gerçek deployment'ta Vercel/Cloudflare arkasında olduğumuz için IP
  // x-forwarded-for header'ından okunur; yoksa iyzico'nun sandbox
  // dokümantasyonundaki örnek IP'ye düşer (sadece test/geliştirme için).
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "85.34.78.112";

  const basketItems = body.items.map((item, index) => ({
    id: item.productId || `item-${index}`,
    name: item.productName,
    category1: "Sanayi Ürünleri",
    itemType: "PHYSICAL",
    price: item.lineTotalIncludingVat.toFixed(2),
  }));

  const addressPayload = {
    contactName: `${buyer.name} ${buyer.surname}`.trim(),
    city: buyer.city,
    country: "Türkiye",
    address: buyer.address,
  };

  const iyzicoRequestBody = {
    locale: "tr",
    conversationId,
    price: priceStr,
    paidPrice: priceStr,
    currency: "TRY",
    basketId: conversationId,
    paymentGroup: "PRODUCT",
    callbackUrl: `${SITE_CONFIG.url}/api/odeme/sonuc`,
    buyer: {
      id: conversationId,
      name: buyer.name,
      surname: buyer.surname,
      gsmNumber: buyer.phone,
      email: buyer.email,
      identityNumber: buyer.identityNumber,
      registrationAddress: buyer.address,
      ip,
      city: buyer.city,
      country: "Türkiye",
    },
    shippingAddress: addressPayload,
    billingAddress: addressPayload,
    basketItems,
  };

  try {
    const result = await iyzicoRequest<{
      status: string;
      checkoutFormContent?: string;
      token?: string;
      errorMessage?: string;
    }>(
      iyzipay.checkoutFormInitialize.create.bind(iyzipay.checkoutFormInitialize),
      iyzicoRequestBody
    );

    if (result.status !== "success" || !result.checkoutFormContent) {
      return NextResponse.json(
        { error: result.errorMessage || "Ödeme başlatılamadı." },
        { status: 400 }
      );
    }

    // Sipariş kaydını "Beklemede" durumunda Sanity'e yaz. Yazma token'ı
    // tanımlı değilse (SANITY_API_TOKEN boşsa) bu adım sessizce atlanır —
    // ödeme akışı sipariş kaydı olmadan da çalışmaya devam eder.
    const writeClient = getWriteClient();
    if (writeClient) {
      try {
        await writeClient.create({
          _type: "order",
          orderNumber: conversationId,
          status: "pending",
          customerName: buyer.name,
          customerSurname: buyer.surname,
          customerEmail: buyer.email,
          customerPhone: buyer.phone,
          customerCity: buyer.city,
          customerAddress: buyer.address,
          items: body.items.map((item) => ({
            _type: "orderItem",
            _key: item.productId || `${item.productName}-${item.unitLabel}`,
            productName: item.productName,
            unitLabel: item.unitLabel,
            quantity: item.quantity,
            unitPrice:
              item.quantity > 0
                ? Number((item.lineTotalIncludingVat / item.quantity).toFixed(2))
                : item.lineTotalIncludingVat,
            lineTotal: item.lineTotalIncludingVat,
          })),
          totalExcludingVat: body.totalExcludingVat,
          totalVat: body.totalVat,
          totalIncludingVat: body.totalPriceIncludingVat,
          iyzicoConversationId: conversationId,
          iyzicoToken: result.token,
        });
      } catch (writeError) {
        // Sipariş kaydı yazılamasa bile ödeme akışını durdurmuyoruz —
        // sadece logluyoruz, kullanıcı yine de ödemeye devam edebilsin.
        console.error("Sipariş Sanity'e yazılamadı:", writeError);
      }
    }

    return NextResponse.json({
      checkoutFormContent: result.checkoutFormContent,
      token: result.token,
    });
  } catch (error) {
    console.error("iyzico checkout initialize hatası:", error);
    return NextResponse.json(
      { error: "Ödeme başlatılırken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
