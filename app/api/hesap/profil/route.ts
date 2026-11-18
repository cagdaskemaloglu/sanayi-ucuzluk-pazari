import { NextResponse } from "next/server";
import { getCurrentCustomerSession } from "@/lib/auth/options";
import { requireWriteClient } from "@/lib/auth/customers";
import { isValidProvinceDistrict } from "@/lib/data/tr-locations";
import { jsonError, readJson, str } from "@/lib/auth/api-helpers";

export const dynamic = "force-dynamic";

// Hesabım → bilgilerimi güncelle (ad, telefon, adres, VKN).
export async function PATCH(request: Request) {
  const session = await getCurrentCustomerSession();
  if (!session) return jsonError("Oturum açmanız gerekiyor.", 401);

  const body = await readJson(request);
  if (!body) return jsonError("Geçersiz istek.");

  const name = str(body.name, 60);
  const phone = str(body.phone, 20).replace(/[\s()-]/g, "");
  const city = str(body.city, 40);
  const district = str(body.district, 60);
  const address = str(body.address, 400);
  const taxNumber = str(body.taxNumber, 20).replace(/\D/g, "");

  if (!name) return jsonError("Ad soyad boş olamaz.");
  if (phone && !/^\+?\d{10,15}$/.test(phone)) return jsonError("Lütfen geçerli bir telefon numarası girin.");
  if ((city || district) && !isValidProvinceDistrict(city, district)) {
    return jsonError("Lütfen listeden geçerli bir il ve ilçe seçin.");
  }
  if (taxNumber && taxNumber.length !== 10 && taxNumber.length !== 11) {
    return jsonError("Vergi kimlik numarası 10, TC kimlik numarası 11 haneli olmalıdır.");
  }

  await requireWriteClient()
    .patch(session.id)
    .set({ name, phone, city, district, address, taxNumber })
    .commit();

  return NextResponse.json({ ok: true });
}
