import { orderStatusTitle } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  paid: "bg-blue-50 text-blue-700 border-blue-200",
  preparing: "bg-amber-50 text-amber-800 border-amber-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

// Müşteriye gösterilen etiketler (Studio'daki "Yeni Sipariş" yerine "Sipariş Alındı").
const CUSTOMER_LABELS: Record<string, string> = {
  paid: "✔️ Sipariş Alındı",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", TONES[status] ?? TONES.cancelled)}>
      {CUSTOMER_LABELS[status] ?? orderStatusTitle(status)}
    </span>
  );
}
