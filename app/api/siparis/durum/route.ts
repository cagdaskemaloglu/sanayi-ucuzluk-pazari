import { randomUUID } from "node:crypto";
import { SIGNATURE_HEADER_NAME, isValidSignature } from "@sanity/webhook";
import { getWriteClient } from "@/lib/sanity/write-client";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { SITE_CONFIG } from "@/lib/constants";
import {
  isCustomerStatusEmail,
  sendCustomerStatusEmail,
  type OrderForStatusEmail,
} from "@/lib/email/order-emails";

// Sanity webhook'u: mağaza sahibi Studio'da bir siparişin DURUMUNU
// değiştirip yayınladığında (Publish) Sanity buraya imzalı bir POST atar,
// biz de müşteriye ilgili durum e-postasını göndeririz.
//
// Sanity tarafındaki webhook ayarı (sanity.io/manage → API → Webhooks):
//   URL        : https://sanayiucuzlukpazari.com/api/siparis/durum
//   Dataset    : production
//   Trigger on : Update
//   Filter     : _type == "order" && delta::changedAny(status)
//   Projection : {_id}
//   Method     : POST,  Secret: Vercel'deki SANITY_WEBHOOK_SECRET ile aynı
//
// Her durum için e-posta yalnızca BİR kez gider: gönderimden önce sipariş
// belgesine "gönderiliyor" kaydı ifRevisionId ile yazılır; aynı anda gelen
// ikinci istek bu yazmada çakışır ve hiçbir şey göndermez. Gönderim
// başarısız olursa 500 dönülür ve Sanity webhook'u kendisi tekrar dener.

export const dynamic = "force-dynamic";

interface StoredOrder extends OrderForStatusEmail {
  _id: string;
  _rev: string;
  status?: string;
  statusEmails?: { _key: string; status?: string; result?: string }[];
}

const ORDER_QUERY = `*[_type == "order" && _id == $id][0]{
  _id, _rev, status, orderNumber,
  customerName, customerSurname, customerEmail, customerPhone,
  customerCity, customerAddress,
  items[]{ productName, unitLabel, quantity, lineTotal },
  totalIncludingVat, shippingFee, grandTotal, paidTotal,
  carrier, trackingNumber, trackingUrl, statusNote,
  statusEmails[]{ _key, status, result }
}`;

function text(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function isRevisionConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 409
  );
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("SANITY_WEBHOOK_SECRET tanımlı değil; sipariş durum webhook'u işlenemedi.");
    return text("webhook secret not configured", 500);
  }

  const body = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? "";
  if (!signature || !(await isValidSignature(body, signature, secret))) {
    console.warn("Sipariş durum webhook'u: geçersiz imza.");
    return text("invalid signature", 401);
  }

  let documentId = "";
  try {
    const payload = JSON.parse(body) as { _id?: unknown };
    documentId = typeof payload._id === "string" ? payload._id : "";
  } catch {
    return text("invalid body", 400);
  }
  // Taslaklar (drafts.) için e-posta gönderilmez; yalnızca yayınlanmış belge.
  if (!documentId || documentId.startsWith("drafts.")) {
    return text("ignored");
  }

  const writeClient = getWriteClient();
  if (!writeClient) {
    console.error("SANITY_API_TOKEN tanımlı değil; sipariş durum e-postası gönderilemedi.");
    return text("sanity token not configured", 500);
  }

  const order = await writeClient.fetch<StoredOrder | null>(ORDER_QUERY, {
    id: documentId,
  });
  if (!order) {
    return text("order not found");
  }

  const status = order.status ?? "";
  if (!isCustomerStatusEmail(status)) {
    return text("no email for this status");
  }

  const alreadyHandled = order.statusEmails?.some(
    (entry) =>
      entry.status === status &&
      (entry.result === "sent" || entry.result === "sending" || entry.result === "skipped")
  );
  if (alreadyHandled) {
    console.log("Durum e-postası zaten gönderilmiş, atlandı:", order.orderNumber, status);
    return text("already sent");
  }

  if (!order.customerEmail) {
    return text("order has no customer email");
  }

  // 1) "Gönderiliyor" kaydını yaz — eşzamanlı ikinci istek burada çakışır.
  const key = randomUUID().replace(/-/g, "").slice(0, 12);
  const note = order.statusNote?.trim() || undefined;
  try {
    await writeClient
      .patch(order._id)
      .ifRevisionId(order._rev)
      .setIfMissing({ statusEmails: [] })
      .append("statusEmails", [
        {
          _key: key,
          _type: "statusEmail",
          status,
          result: "sending",
          at: new Date().toISOString(),
          ...(note ? { note } : {}),
        },
      ])
      .commit();
  } catch (error) {
    if (isRevisionConflict(error)) {
      // Belge bu arada değişti (başka bir istek veya düzenleme). 503 ile
      // Sanity'nin tekrar denemesini istiyoruz; o arada e-posta gittiyse
      // tekrar denemede "already sent" ile durulur.
      return text("concurrent update, retry later", 503);
    }
    console.error("Durum e-postası kaydı yazılamadı:", order.orderNumber, error);
    return text("error", 500);
  }

  // 2) E-postayı gönder.
  const siteSettings = await getSiteSettings().catch(() => null);
  const result = await sendCustomerStatusEmail(order, status, {
    name: siteSettings?.siteTitle || SITE_CONFIG.name,
    email: siteSettings?.email || undefined,
    phone: siteSettings?.phone || undefined,
    whatsappNumber: siteSettings?.whatsappNumber || undefined,
  });

  const outcome = result.ok ? "sent" : result.skipped ? "skipped" : "failed";
  const errorMessage = !result.ok && !result.skipped ? result.error.slice(0, 300) : undefined;

  if (outcome === "sent") {
    console.log("Durum e-postası gönderildi:", order.orderNumber, status);
  } else if (outcome === "skipped") {
    console.warn(
      "Durum e-postası ATLANDI (RESEND_API_KEY / ORDER_EMAIL_FROM tanımlı değil):",
      order.orderNumber,
      status
    );
  } else {
    console.error("Durum e-postası gönderilemedi:", order.orderNumber, status, errorMessage);
  }

  // 3) Sonucu kaydet. Gönderildiyse "Müşteriye Not" alanı temizlenir ki bir
  //    sonraki durum e-postasında tekrar gitmesin (not, kayıtta saklanır).
  try {
    let patch = writeClient.patch(order._id).set({
      [`statusEmails[_key=="${key}"].result`]: outcome,
      ...(errorMessage ? { [`statusEmails[_key=="${key}"].error`]: errorMessage } : {}),
    });
    if (outcome === "sent" && note) {
      patch = patch.unset(["statusNote"]);
    }
    await patch.commit();
  } catch (error) {
    console.error("Durum e-postası sonucu kaydedilemedi:", order.orderNumber, error);
  }

  // Başarısızsa 500: Sanity webhook'u bir süre sonra tekrar dener; kayıt
  // "failed" olduğu için yeniden gönderim yapılır.
  return outcome === "failed" ? text("email failed", 500) : text("OK");
}
