import { SITE_CONFIG } from "@/lib/constants";
import { escapeHtml, wrap } from "./order-emails";
import { sendEmail, type SendEmailResult } from "./resend";

// Üyelik e-postaları: e-posta doğrulama ve şifre sıfırlama.

function buttonHtml(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#0F2A4A;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold">${escapeHtml(label)}</a></p>`;
}

export async function sendVerificationEmail(params: {
  to: string;
  name?: string;
  token: string;
  shopName: string;
}): Promise<SendEmailResult> {
  const link = `${SITE_CONFIG.url}/api/hesap/dogrula?token=${encodeURIComponent(params.token)}`;
  const hello = params.name ? `Merhaba ${params.name},` : "Merhaba,";
  return sendEmail({
    to: [params.to],
    subject: `${params.shopName} — E-posta adresinizi doğrulayın`,
    html: wrap(
      "E-posta adresinizi doğrulayın",
      `<p style="margin:0 0 12px">${escapeHtml(hello)}</p>
       <p style="margin:0">Üyeliğinizi tamamlamak için aşağıdaki butona tıklayın. Link 24 saat geçerlidir.</p>
       ${buttonHtml(link, "E-postamı Doğrula")}
       <p style="margin:0;font-size:12px;color:#6b7280">Buton çalışmazsa bu linki tarayıcınıza yapıştırın:<br>${escapeHtml(link)}</p>
       <p style="margin:16px 0 0;font-size:12px;color:#6b7280">Bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`
    ),
    text: `${hello}\n\nÜyeliğinizi tamamlamak için bu linke tıklayın (24 saat geçerli):\n${link}\n\nBu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name?: string;
  token: string;
  shopName: string;
}): Promise<SendEmailResult> {
  const link = `${SITE_CONFIG.url}/sifre-sifirla?token=${encodeURIComponent(params.token)}`;
  const hello = params.name ? `Merhaba ${params.name},` : "Merhaba,";
  return sendEmail({
    to: [params.to],
    subject: `${params.shopName} — Şifre sıfırlama`,
    html: wrap(
      "Şifrenizi sıfırlayın",
      `<p style="margin:0 0 12px">${escapeHtml(hello)}</p>
       <p style="margin:0">Hesabınız için şifre sıfırlama talebi aldık. Yeni şifre belirlemek için aşağıdaki butona tıklayın. Link 1 saat geçerlidir.</p>
       ${buttonHtml(link, "Yeni Şifre Belirle")}
       <p style="margin:0;font-size:12px;color:#6b7280">Buton çalışmazsa bu linki tarayıcınıza yapıştırın:<br>${escapeHtml(link)}</p>
       <p style="margin:16px 0 0;font-size:12px;color:#6b7280">Bu talebi siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmez.</p>`
    ),
    text: `${hello}\n\nYeni şifre belirlemek için bu linke tıklayın (1 saat geçerli):\n${link}\n\nBu talebi siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmez.`,
  });
}
