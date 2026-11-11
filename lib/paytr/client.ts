import crypto from "node:crypto";

// PayTR iFrame API — dokümantasyon: https://dev.paytr.com/iframe-api
const GET_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

export interface PaytrConfig {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  /** "1" = test modu (varsayılan), "0" = canlı. */
  testMode: "0" | "1";
}

// Anahtarlar tanımlı değilse null döner — çağıran taraf kullanıcıya anlaşılır
// bir mesaj göstermeli, uygulamayı çökertmemeli. Test modu, yalnızca
// PAYTR_TEST_MODE=0 yazıldığında kapanır (yanlışlıkla canlıya düşmemek için).
export function getPaytrConfig(): PaytrConfig | null {
  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

  if (!merchantId || !merchantKey || !merchantSalt) {
    return null;
  }

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode: process.env.PAYTR_TEST_MODE === "0" ? "0" : "1",
  };
}

function hmacBase64(data: string, key: string): string {
  return crypto.createHmac("sha256", key).update(data).digest("base64");
}

// PayTR merchant_oid kuralı: en fazla 64 karakter, yalnızca alfanümerik
// (tire/alt çizgi YOK). Zaman damgası + rastgele ek, çakışmayı önler.
export function generateMerchantOid(): string {
  return `SUP${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/** [ürün adı, birim fiyat ("18.00"), adet] */
export type BasketLine = [name: string, unitPrice: string, quantity: number];

export interface CreateTokenParams {
  userIp: string;
  merchantOid: string;
  email: string;
  /** Kuruş cinsinden tam sayı (34,56 ₺ → 3456). */
  paymentAmountKurus: number;
  basket: BasketLine[];
  userName: string;
  userAddress: string;
  userPhone: string;
  okUrl: string;
  failUrl: string;
}

export type CreateTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

export async function createPaytrToken(
  config: PaytrConfig,
  params: CreateTokenParams
): Promise<CreateTokenResult> {
  const userBasket = Buffer.from(JSON.stringify(params.basket), "utf8").toString(
    "base64"
  );
  const noInstallment = "0";
  const maxInstallment = "0";
  const currency = "TL";
  const paymentAmount = String(params.paymentAmountKurus);

  // Hash sırası PayTR dokümantasyonundaki ile birebir aynı olmalı.
  const hashStr =
    config.merchantId +
    params.userIp +
    params.merchantOid +
    params.email +
    paymentAmount +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    config.testMode;

  const paytrToken = hmacBase64(
    hashStr + config.merchantSalt,
    config.merchantKey
  );

  const body = new URLSearchParams({
    merchant_id: config.merchantId,
    user_ip: params.userIp,
    merchant_oid: params.merchantOid,
    email: params.email,
    payment_amount: paymentAmount,
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: config.testMode === "1" ? "1" : "0",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: params.userName,
    user_address: params.userAddress,
    user_phone: params.userPhone,
    merchant_ok_url: params.okUrl,
    merchant_fail_url: params.failUrl,
    timeout_limit: "30",
    currency,
    test_mode: config.testMode,
    lang: "tr",
  });

  const response = await fetch(GET_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = (await response.json()) as {
    status?: string;
    token?: string;
    reason?: string;
  };

  if (data.status === "success" && data.token) {
    return { ok: true, token: data.token };
  }

  return { ok: false, reason: data.reason ?? "Bilinmeyen PayTR hatası" };
}

export interface PaytrNotification {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}

// Bildirimin gerçekten PayTR'dan geldiğini ve değişmediğini doğrular.
// Bu kontrol atlanırsa herkes sahte "success" bildirimi gönderebilir.
export function verifyPaytrNotification(
  config: PaytrConfig,
  notification: PaytrNotification
): boolean {
  const expected = hmacBase64(
    notification.merchantOid +
      config.merchantSalt +
      notification.status +
      notification.totalAmount,
    config.merchantKey
  );

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(notification.hash);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
