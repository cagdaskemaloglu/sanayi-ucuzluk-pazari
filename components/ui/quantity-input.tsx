"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Sunucudaki üst sınırla aynı (lib/checkout/compute-lines.ts → MAX_QUANTITY).
export const MAX_QUANTITY = 100_000;

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  /**
   * true ise 1'deyken "−" butonu 0 gönderir (sepette ürünü kaldırmak için).
   * Klavyeyle girilen değer her zaman en az 1'dir.
   */
  allowRemove?: boolean;
  className?: string;
  buttonClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
}

// − / + butonlarının yanında klavyeyle de miktar yazılabilen alan.
// Yazarken alan geçici olarak boş kalabilir; odak çıkınca (veya Enter'a
// basılınca) geçerli bir sayıya (1 … MAX_QUANTITY) yuvarlanır.
export function QuantityInput({
  value,
  onChange,
  allowRemove = false,
  className,
  buttonClassName,
  inputClassName,
  iconClassName = "h-4 w-4",
}: QuantityInputProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function clamp(next: number) {
    return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(next)));
  }

  function commit() {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isFinite(parsed) ? clamp(parsed) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return (
    <div className={cn("flex items-center", className)}>
      <button
        type="button"
        onClick={() =>
          onChange(allowRemove && value <= 1 ? 0 : clamp(value - 1))
        }
        className={buttonClassName}
        aria-label="Azalt"
      >
        <Minus className={iconClassName} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label="Miktar"
        value={draft}
        onChange={(event) =>
          setDraft(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        onFocus={(event) => event.target.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={cn(
          "bg-transparent text-center text-sm tabular-nums outline-none focus:ring-1 focus:ring-brand-navy",
          inputClassName
        )}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        className={buttonClassName}
        aria-label="Artır"
      >
        <Plus className={iconClassName} />
      </button>
    </div>
  );
}
