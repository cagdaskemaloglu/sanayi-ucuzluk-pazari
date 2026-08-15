"use server";

// Bu fonksiyon token'ı Cloudflare'in sunucusuna göndererek doğrular.
// TURNSTILE_SECRET_KEY sadece sunucuda kalır, client'a asla gönderilmez.
export async function verifyTurnstileToken(
  token: string
): Promise<{ success: boolean }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Turnstile henüz kurulmadıysa (secret key tanımlı değilse) doğrulamayı
  // atla — geliştirme sırasında bloklanmamak için.
  if (!secretKey) {
    return { success: true };
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: secretKey, response: token }),
      }
    );

    const data = await response.json();
    return { success: Boolean(data.success) };
  } catch {
    return { success: false };
  }
}
