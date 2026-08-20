// T.C. Kimlik Numarası doğrulama algoritması (resmi kontrol basamağı formülü).
// Sadece formatı değil, kontrol basamaklarını da doğrular — rastgele
// 11 haneli bir sayının "geçerli" görünmesini engeller.
export function isValidTcKimlikNo(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;
  if (value[0] === "0") return false;

  const digits = value.split("").map(Number);

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const rawCheck10 = oddSum * 7 - evenSum;
  const check10 = ((rawCheck10 % 10) + 10) % 10;
  if (check10 !== digits[9]) return false;

  const check11 = (oddSum + evenSum + digits[9]) % 10;
  if (check11 !== digits[10]) return false;

  return true;
}
