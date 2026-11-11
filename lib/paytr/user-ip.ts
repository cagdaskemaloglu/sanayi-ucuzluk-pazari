import type { NextRequest } from "next/server";

// PayTR, token isteğinde müşterinin GERÇEK (dış) IP adresini ister; yerel
// makinede (localhost) bu adres ::1 / 127.0.0.1 gibi olur ve PayTR
// "geçersiz paytr_token" hatası verir. Bu yüzden:
//   1) PAYTR_USER_IP_OVERRIDE tanımlıysa o kullanılır,
//   2) yoksa x-forwarded-for başlığındaki adres (Vercel/Cloudflare arkasında gerçek IP),
//   3) o da yoksa/özel ağ adresiyse ve sadece geliştirme ortamındaysak
//      api.ipify.org'dan makinenin dış IP'si alınır.
function isUsableIp(ip: string | undefined | null): ip is string {
  if (!ip) return false;
  if (ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.")) return false;
  if (ip.startsWith("192.168.") || ip.startsWith("169.254.")) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return false;
  const lower = ip.toLowerCase();
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return false;
  }
  return true;
}

async function fetchPublicIp(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch("https://api.ipify.org", {
      signal: controller.signal,
      cache: "no-store",
    });
    const ip = (await response.text()).trim();
    return isUsableIp(ip) ? ip : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveUserIp(request: NextRequest): Promise<string | null> {
  const override = process.env.PAYTR_USER_IP_OVERRIDE?.trim();
  if (override) return override;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (isUsableIp(forwarded)) return forwarded;

  if (process.env.NODE_ENV !== "production") {
    return fetchPublicIp();
  }

  return null;
}
