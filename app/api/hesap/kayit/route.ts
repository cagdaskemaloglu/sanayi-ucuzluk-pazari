import { NextResponse } from "next/server";
import {
  createCustomer,
  findCustomerByEmail,
  requireWriteClient,
} from "@/lib/auth/customers";
import {
  createOneTimeToken,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  validatePasswordStrength,
} from "@/lib/auth/password";
import { getShopName, jsonError, passesBotCheck, readJson, str } from "@/lib/auth/api-helpers";
import { sendVerificationEmail } from "@/lib/email/account-emails";

export const dynamic = "force-dynamic";

const VERIFY_HOURS = 24;

// E-posta + şifre ile kayıt. Hesap, e-posta doğrulanana kadar şifreyle
// giriş yapamaz.
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Geçersiz istek.");

  if (!(await passesBotCheck(body.turnstileToken))) {
    return jsonError("Doğrulama başarısız. Lütfen sayfayı yenileyip tekrar deneyin.");
  }

  const name = str(body.name, 60);
  const email = normalizeEmail(str(body.email, 100));
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) return jsonError("Lütfen adınızı ve soyadınızı girin.");
  if (!isValidEmail(email)) return jsonError("Lütfen geçerli bir e-posta adresi girin (Türkçe karakter içermemeli).");
  const passwordError = validatePasswordStrength(password);
  if (passwordError) return jsonError(passwordError);
  if (body.kvkk !== true) return jsonError("Devam etmek için KVKK Aydınlatma Metni'ni onaylayın.");

  const existing = await findCustomerByEmail(email);
  if (existing?.emailVerified) {
    return jsonError(
      existing.passwordHash
        ? "Bu e-posta ile zaten bir üyelik var. Giriş yapın veya 'Şifremi unuttum' ile şifrenizi sıfırlayın."
        : "Bu e-posta ile Google üzerinden üyelik var. 'Google ile devam et' ile giriş yapabilir veya 'Şifremi unuttum' ile şifre belirleyebilirsiniz.",
      409
    );
  }

  // Doğrulama mailini çok sık tekrar göndermeyelim (dakikada bir).
  if (existing?.verifyTokenExpires) {
    const sentAt = new Date(existing.verifyTokenExpires).getTime() - VERIFY_HOURS * 3600_000;
    if (Date.now() - sentAt < 60_000) {
      return jsonError("Doğrulama e-postası az önce gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.", 429);
    }
  }

  const { token, tokenHash } = createOneTimeToken();
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const fields = {
    name,
    passwordHash,
    authProviders: ["password"],
    verifyTokenHash: tokenHash,
    verifyTokenExpires: new Date(now.getTime() + VERIFY_HOURS * 3600_000).toISOString(),
    kvkkAcceptedAt: now.toISOString(),
  };

  try {
    if (existing) {
      // Doğrulanmamış eski kayıt: bilgileri güncelle, yeni link gönder.
      await requireWriteClient().patch(existing._id).set(fields).commit();
    } else {
      await createCustomer({ email, ...fields });
    }
  } catch (error) {
    console.error("Üye kaydı oluşturulamadı:", error);
    return jsonError("Kayıt şu anda yapılamıyor. Lütfen daha sonra tekrar deneyin.", 500);
  }

  const result = await sendVerificationEmail({ to: email, name, token, shopName: await getShopName() });
  if (!result.ok) {
    console.error("Doğrulama e-postası gönderilemedi:", email, result.skipped ? "e-posta ayarı yok" : result.error);
    return jsonError("Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin veya bize ulaşın.", 500);
  }

  return NextResponse.json({ ok: true });
}
