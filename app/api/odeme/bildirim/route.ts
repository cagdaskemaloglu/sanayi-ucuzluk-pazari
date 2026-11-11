import { NextRequest } from "next/server";
import { getPaytrConfig, verifyPaytrNotification } from "@/lib/paytr/client";
import { getWriteClient } from "@/lib/sanity/write-client";

export const dynamic = "force-dynamic";

// PayTR, ödeme sonucunu (başarılı/başarısız) tarayıcıdan bağımsız olarak,
// PayTR mağaza panelinde tanımlı "Bildirim URL" adresine sunucudan sunucuya
// POST eder. Ödemenin gerçekten alındığının TEK güvenilir kanıtı budur —
// müşterinin döndüğü /odeme/basarili sayfası sadece bilgilendirmedir.
//
// Kurallar (PayTR dokümantasyonu):
//  - Yanıt gövdesi tam olarak düz metin "OK" olmalı (HTML/başka metin olmamalı),
//    aksi halde PayTR bildirimi tekrar tekrar gönderir.
//  - Aynı sipariş için birden fazla bildirim gelebilir; yalnızca ilki dikkate alınır.
//  - Hash doğrulanmadan hiçbir işlem yapılmamalı.
function plain(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const config = getPaytrConfig();
  if (!config) {
    return plain("PAYTR not configured", 500);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return plain("invalid body", 400);
  }

  const merchantOid = form.get("merchant_oid")?.toString() ?? "";
  const status = form.get("status")?.toString() ?? "";
  const totalAmount = form.get("total_amount")?.toString() ?? "";
  const hash = form.get("hash")?.toString() ?? "";

  if (!merchantOid || !status || !totalAmount || !hash) {
    return plain("missing fields", 400);
  }

  if (!verifyPaytrNotification(config, { merchantOid, status, totalAmount, hash })) {
    return plain("PAYTR notification failed: bad hash", 400);
  }

  const writeClient = getWriteClient();
  if (!writeClient) {
    // Sipariş kaydı tutulmuyor (SANITY_API_TOKEN yok) — güncellenecek bir şey yok.
    return plain("OK");
  }

  try {
    const order = await writeClient.fetch<{
      _id: string;
      status: string;
      totalIncludingVat: number;
    } | null>(
      `*[_type == "order" && orderNumber == $orderNumber][0]{ _id, status, totalIncludingVat }`,
      { orderNumber: merchantOid }
    );

    if (!order) {
      console.warn("PayTR bildirimi için sipariş bulunamadı:", merchantOid);
      return plain("OK");
    }

    // Yalnızca ilk bildirim işlenir (sipariş zaten kesinleştiyse dokunma).
    if (order.status !== "pending") {
      return plain("OK");
    }

    if (status === "success") {
      // total_amount kuruş cinsindendir ve taksit vade farkı dahil
      // olabileceği için sipariş tutarından yüksek gelmesi normaldir.
      const paidTotal = Number(totalAmount) / 100;
      if (paidTotal + 0.001 < order.totalIncludingVat) {
        console.error(
          "PayTR tahsilat tutarı sipariş tutarından düşük:",
          merchantOid,
          paidTotal,
          order.totalIncludingVat
        );
      }

      await writeClient
        .patch(order._id)
        .set({
          status: "paid",
          paidAt: new Date().toISOString(),
          paidTotal,
        })
        .commit();
    } else {
      await writeClient
        .patch(order._id)
        .set({
          status: "failed",
          paymentFailureReason: form.get("failed_reason_msg")?.toString() ?? "",
        })
        .commit();
    }
  } catch (error) {
    // "OK" DÖNMEYİZ: PayTR bildirimi daha sonra tekrar göndersin.
    console.error("PayTR bildirimi işlenemedi:", error);
    return plain("error", 500);
  }

  return plain("OK");
}
