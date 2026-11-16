import data from "./tr-il-ilce.json";

// Türkiye il ve ilçe listesi (81 il, 973 ilçe), alfabetik (Türkçe) sıralı.
// Kaynak: turkey-neighbourhoods v4.0.3 (MIT, © Murat Gözel) —
// https://github.com/muratgozel/turkey-neighbourhoods
// Yalnızca il → ilçe verisi alınıp tr-il-ilce.json olarak projeye eklendi.

export interface TrProvince {
  il: string;
  ilceler: string[];
}

export const TR_PROVINCES: TrProvince[] = data;

export function getDistricts(province: string): string[] {
  return TR_PROVINCES.find((item) => item.il === province)?.ilceler ?? [];
}

export function isValidProvinceDistrict(province: string, district: string): boolean {
  return getDistricts(province).includes(district);
}
