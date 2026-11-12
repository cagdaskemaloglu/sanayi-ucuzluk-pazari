// Kargo ücreti hesabı — hem sunucu (PayTR tahsilatı) hem tarayıcı (sepet ve
// ödeme sayfasındaki gösterim) bu tek fonksiyonu kullanır ki gösterilen ve
// tahsil edilen tutar asla birbirinden farklı olmasın.
//
// Değerler Sanity → Site Ayarları'ndan gelir ve KDV DAHİL girilir:
//  - shippingFee boşsa: online ödemede kargo ücreti alınmaz (0).
//  - shippingFee 0 ise: her zaman ücretsiz.
//  - freeShippingThreshold doluysa: sipariş (KDV dahil) toplamı bu tutara
//    eşit veya üzerindeyse ücretsiz.

export interface ShippingSettings {
  shippingFee?: number | null;
  freeShippingThreshold?: number | null;
}

export function calculateShippingFee(
  orderTotalIncludingVat: number,
  settings: ShippingSettings | null | undefined
): number {
  const fee = settings?.shippingFee;
  if (fee === undefined || fee === null || fee <= 0) return 0;

  const threshold = settings?.freeShippingThreshold;
  if (
    threshold !== undefined &&
    threshold !== null &&
    orderTotalIncludingVat >= threshold
  ) {
    return 0;
  }

  return Math.round(fee * 100) / 100;
}

/** Sadece tarayıcıya gönderilecek kargo alanlarını ayıklar. */
export function pickShippingSettings(
  settings: ShippingSettings | null | undefined
): ShippingSettings {
  return {
    shippingFee: settings?.shippingFee ?? null,
    freeShippingThreshold: settings?.freeShippingThreshold ?? null,
  };
}
