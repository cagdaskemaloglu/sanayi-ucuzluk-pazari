// Resend (https://resend.com) ile e-posta gönderimi — ek paket gerektirmeden
// doğrudan REST API üzerinden. SADECE sunucu tarafında kullanılır.
//
// Gerekli env değişkenleri (Vercel → Settings → Environment Variables):
//  - RESEND_API_KEY   : Resend → API Keys → Create (Secret olarak ekleyin)
//  - ORDER_EMAIL_FROM : Gönderen adres, örn.
//                       "Sanayi Ucuzluk Pazarı <siparis@sanayiucuzlukpazari.com>"
//                       (domain Resend → Domains'te doğrulanmış olmalı)
// Tanımlı değilse e-posta gönderimi sessizce atlanır, ödeme akışı etkilenmez.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export type SendEmailResult =
  | { ok: true }
  | { ok: false; skipped: true }
  | { ok: false; skipped?: false; error: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM);
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, skipped: true };
  }

  const recipients = params.to.map((address) => address.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { ok: false, error: `Resend ${response.status}: ${detail.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
