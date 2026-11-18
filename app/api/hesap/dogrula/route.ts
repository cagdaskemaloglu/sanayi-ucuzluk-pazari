import { NextResponse } from "next/server";
import { findCustomerByTokenHash, isExpired, requireWriteClient } from "@/lib/auth/customers";
import { hashToken } from "@/lib/auth/password";
import { SITE_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

// E-posta doğrulama linki: /api/hesap/dogrula?token=...
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const redirect = (query: string) => NextResponse.redirect(`${SITE_CONFIG.url}/giris?${query}`);

  if (!token) return redirect("hata=dogrulama");

  const customer = await findCustomerByTokenHash("verifyTokenHash", hashToken(token));
  if (!customer || isExpired(customer.verifyTokenExpires)) {
    return redirect("hata=dogrulama");
  }

  const providers = new Set(customer.authProviders ?? []);
  providers.add("password");
  await requireWriteClient()
    .patch(customer._id)
    .set({ emailVerified: new Date().toISOString(), authProviders: Array.from(providers) })
    .unset(["verifyTokenHash", "verifyTokenExpires"])
    .commit();

  return redirect(`dogrulandi=1&email=${encodeURIComponent(customer.email)}`);
}
