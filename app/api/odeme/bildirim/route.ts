import { NextRequest } from "next/server";
import { getPaytrConfig, verifyPaytrNotification } from "@/lib/paytr/client";
import { getWriteClient } from "@/lib/sanity/write-client";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { SITE_CONFIG } from "@/lib/constants";
import {
  sendCustomerOrderConfirmation,
  sendShopOrderNotification,
  type PaidOrderForEmail,
} from "@/lib/email/order-emails";

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
type StoredOrder = Omit<PaidOrderForEmail, "paidTotal"> & {
  _id: string;
  _rev: string;
  status: string;
};

const ORDER_QUERY = `*[_type == "order" && orderNumber == $orderNumber][0]{
  _id, _rev, status, orderNumber,
  customerName, customerSurname, customerEmail, customerPhone,
  customerCity, customerAddress,
  items[]{ productName, unitLabel, quantity, lineTotal },
  totalIncludingVat, shippingFee, grandTotal
}`;

function isRevisionConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 409
  );
}

// Ödeme onaylandıktan sonra işletmeye ve müşteriye e-posta gönderir.
// E-posta hatası ödeme kaydını ASLA bozmaz: sadece loglanır.
async function sendPaidOrderEmails(
  order: PaidOrderForEmail
): Promise<boolean> {
  const siteSettings = await getSiteSettings().catch(() => null);
  const shop = {
    name: siteSettings?.siteTitle || SITE_CONFIG.name,
    email: siteSettings?.email || undefined,
    phone: siteSettings?.phone || undefined,
    whatsappNumber: siteSettings?.whatsappNumber || undefined,
  };

  const [shopResult, customerResult] = await Promise.all([
    sendShopOrderNotification(order, shop),
    sendCustomerOrderConfirmation(order, shop),
  ]);

  for (const [label, result] of [
    ["işletme", shopResult],
    ["müşteri", customerResult],
  ] as const) {
    if (result.ok) {
      console.log(`Sipariş e-postası (${label}) gönderildi:`, order.orderNumber);
    } else if (result.skipped) {
      console.warn(
        `Sipariş e-postası (${label}) ATLANDI: RESEND_API_KEY / ORDER_EMAIL_FROM tanımlı değil` +
          (label === "işletme" ? " veya alıcı adresi (ORDER_NOTIFICATION_EMAIL / Site Ayarları e-posta) boş" : "") +
          ".",
        order.orderNumber
      );
    } else {
      console.error(`Sipariş e-postası (${label}) gönderilemedi:`, order.orderNumber, result.error);
    }
  }

  return shopResult.ok || customerResult.ok;
}

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

  console.log("PayTR bildirimi alındı:", merchantOid, status, totalAmount);

  if (!verifyPaytrNotification(config, { merchantOid, status, totalAmount, hash })) {
    console.error(
      "PayTR bildirimi hash doğrulaması başarısız (PAYTR_MERCHANT_KEY/SALT doğru mu?):",
      merchantOid
    );
    return plain("PAYTR notification failed: bad hash", 400);
  }

  const writeClient = getWriteClient();
  if (!writeClient) {
    console.warn("SANITY_API_TOKEN tanımlı değil; sipariş güncellenmedi:", merchantOid);
    // Sipariş kaydı tutulmuyor (SANITY_API_TOKEN yok) — güncellenecek bir şey yok.
    return plain("OK");
  }

  let paidOrder: PaidOrderForEmail | null = null;
  let paidOrderId: string | null = null;

  try {
    const order = await writeClient.fetch<StoredOrder | null>(ORDER_QUERY, {
      orderNumber: merchantOid,
    });

    if (!order) {
      console.warn("PayTR bildirimi için sipariş bulunamadı:", merchantOid);
      return plain("OK");
    }

    // Yalnızca ilk bildirim işlenir (sipariş zaten kesinleştiyse dokunma).
    if (order.status !== "pending") {
      console.log("Sipariş zaten işlenmiş, bildirim yok sayıldı:", merchantOid, order.status);
      return plain("OK");
    }

    // ifRevisionId: aynı anda iki bildirim gelirse yalnızca biri siparişi
    // güncelleyebilir (diğeri 409 alır) — böylece e-postalar da bir kez gider.
    if (status === "success") {
      // total_amount kuruş cinsindendir ve taksit vade farkı dahil
      // olabileceği için sipariş tutarından yüksek gelmesi normaldir.
      const paidTotal = Number(totalAmount) / 100;
      const expectedTotal = order.grandTotal ?? order.totalIncludingVat;
      if (paidTotal + 0.001 < expectedTotal) {
        console.error(
          "PayTR tahsilat tutarı sipariş tutarından düşük:",
          merchantOid,
          paidTotal,
          expectedTotal
        );
      }

      await writeClient
        .patch(order._id)
        .ifRevisionId(order._rev)
        .set({
          status: "paid",
          paidAt: new Date().toISOString(),
          paidTotal,
        })
        .commit();

      paidOrder = { ...order, paidTotal };
      paidOrderId = order._id;
    } else {
      await writeClient
        .patch(order._id)
        .ifRevisionId(order._rev)
        .set({
          status: "failed",
          paymentFailureReason: form.get("failed_reason_msg")?.toString() ?? "",
        })
        .commit();
    }
  } catch (error) {
    if (isRevisionConflict(error)) {
      // Başka bir bildirim bu siparişi az önce işledi.
      return plain("OK");
    }
    // "OK" DÖNMEYİZ: PayTR bildirimi daha sonra tekrar göndersin.
    console.error("PayTR bildirimi işlenemedi:", error);
    return plain("error", 500);
  }

  if (paidOrder && paidOrderId) {
    try {
      const sent = await sendPaidOrderEmails(paidOrder);
      if (sent) {
        await writeClient
          .patch(paidOrderId)
          .set({ notificationEmailSentAt: new Date().toISOString() })
          .commit();
      }
    } catch (error) {
      // Ödeme kaydı tamam; e-posta/işaretleme hatası PayTR'a yansıtılmaz.
      console.error("Sipariş e-postası işlenemedi:", merchantOid, error);
    }
  }

  return plain("OK");
}
