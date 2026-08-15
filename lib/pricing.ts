export const UNIT_LABELS: Record<string, string> = {
  adet: "Adet",
  kutu: "Kutu",
  koli: "Koli",
  palet: "Palet",
};

export function formatPrice(price: number) {
  return `${price.toLocaleString("tr-TR")} ₺`;
}
