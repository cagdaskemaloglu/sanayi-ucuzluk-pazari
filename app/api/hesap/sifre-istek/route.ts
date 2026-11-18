import { NextResponse } from "next/server";
import { findCustomerByEmail, requireWriteClient } from "@/lib/auth/customers";
import { createOneTimeToken, isValidEmail, normalizeEmail } from "@/lib/auth/password";
import { getShopName, jsonError, passesBotCheck, readJson, str } from "@/lib/auth/api-helpers";
import { sendPasswordResetEmail } from "@/lib/email/account-emails";

export const dynamic = "force-dynamic";

const RESET_MINUTES = 60;

// "Şifremi unuttum". Hesap olsun olmasın aynı yanıt döner (hangi
// e-postaların üye olduğu bu yolla öğrenilemesin).
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Geçersiz istek.");
  if (!(await passesBotCheck(body.turnstileToken))) {
    return jsonError("Doğrulama başarısız. Lütfen sayfayı yenileyip tekrar deneyin.");
  }

  const email = normalizeEmail(str(body.email, 100));
  if (!isValidEmail(email)) return jsonError("Lütfen geçerli bir e-posta adresi girin.");

  const customer = await findCustomerByEmail(email);
  if (customer) {
    const sentAt = customer.resetTokenExpires
      ? new Date(customer.resetTokenExpires).getTime() - RESET_MINUTES * 60_000
      : 0;
    // Dakikada en fazla bir sıfırlama e-postası.
    if (Date.now() - sentAt >= 60_000) {
      const { token, tokenHash } = createOneTimeToken();
      await requireWriteClient()
        .patch(customer._id)
        .set({
          resetTokenHash: tokenHash,
          resetTokenExpires: new Date(Date.now() + RESET_MINUTES * 60_000).toISOString(),
        })
        .commit();
      const result = await sendPasswordResetEmail({
        to: customer.email,
        name: customer.name,
        token,
        shopName: await getShopName(),
      });
      if (!result.ok) {
        console.error("Şifre sıfırlama e-postası gönderilemedi:", result.skipped ? "e-posta ayarı yok" : result.error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
