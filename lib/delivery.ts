// "Bugün kargoda / Yarın kargoda" hesabı — Türkiye saatine (Europe/Istanbul)
// göre, ziyaretçinin cihaz saat diliminden bağımsız.
//
// Kural (müşteri isteği): 00.00 – 15.00 arası verilen siparişler "Bugün
// kargoda", 15.00'ten sonrası "Yarın kargoda". Kesim saati Sanity → Site
// Ayarları'ndan değiştirilebilir. Pazar günü kargo çıkışı yapılmıyorsa
// (varsayılan) Cumartesi kesim sonrası ve Pazar günü "Pazartesi kargoda"
// gösterilir.

export interface DeliverySettings {
  /** Bu saatten (TR) önce verilen siparişler aynı gün kargoda. Varsayılan 15. */
  cutoffHour?: number | null;
  /** Pazar günü kargo çıkışı var mı? Varsayılan: yok. */
  sundayShipping?: boolean | null;
}

export const DEFAULT_CUTOFF_HOUR = 15;

const WEEKDAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function istanbulNow(date: Date): { weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { weekday, hour: Number(get("hour")), minute: Number(get("minute")) };
}

export interface ShippingDayInfo {
  /** 0 = bugün, 1 = yarın, 2+ = ileri bir gün */
  daysFromToday: number;
  label: string;
}

export function getShippingDay(
  settings: DeliverySettings | null | undefined,
  now: Date = new Date()
): ShippingDayInfo {
  const cutoff =
    typeof settings?.cutoffHour === "number" && settings.cutoffHour >= 0 && settings.cutoffHour <= 24
      ? settings.cutoffHour
      : DEFAULT_CUTOFF_HOUR;
  const sundayShipping = settings?.sundayShipping === true;

  const { weekday, hour } = istanbulNow(now);

  let daysFromToday = hour < cutoff ? 0 : 1;
  // Kargo çıkışı olmayan günleri (Pazar) atla.
  if (!sundayShipping && (weekday + daysFromToday) % 7 === 0) {
    daysFromToday += 1;
  }

  const label =
    daysFromToday === 0
      ? "Bugün kargoda"
      : daysFromToday === 1
        ? "Yarın kargoda"
        : `${WEEKDAYS_TR[(weekday + daysFromToday) % 7]} kargoda`;

  return { daysFromToday, label };
}
