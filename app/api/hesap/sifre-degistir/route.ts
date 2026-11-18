import { NextResponse } from "next/server";
import { getCurrentCustomerSession } from "@/lib/auth/options";
import { findCustomerById, requireWriteClient } from "@/lib/auth/customers";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { jsonError, readJson } from "@/lib/auth/api-helpers";

export const dynamic = "force-dynamic";

// Hesabım → şifre değiştir / (yalnızca Google ile kayıtlıysa) şifre belirle.
export async function POST(request: Request) {
  const session = await getCurrentCustomerSession();
  if (!session) return jsonError("Oturum açmanız gerekiyor.", 401);

  const body = await readJson(request);
  if (!body) return jsonError("Geçersiz istek.");
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  const customer = await findCustomerById(session.id);
  if (!customer) return jsonError("Hesap bulunamadı.", 404);

  if (customer.passwordHash && !(await verifyPassword(currentPassword, customer.passwordHash))) {
    return jsonError("Mevcut şifreniz hatalı.");
  }
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) return jsonError(passwordError);

  const providers = new Set(customer.authProviders ?? []);
  providers.add("password");
  await requireWriteClient()
    .patch(customer._id)
    .set({ passwordHash: await hashPassword(newPassword), authProviders: Array.from(providers) })
    .commit();

  return NextResponse.json({ ok: true });
}
