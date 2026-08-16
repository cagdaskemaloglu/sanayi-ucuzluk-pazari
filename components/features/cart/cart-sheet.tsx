"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/features/cart/turnstile-widget";
import { useCart } from "@/lib/cart/cart-context";
import { UNIT_LABELS, formatPrice, getEffectiveUnitPrice } from "@/lib/pricing";
import { buildWhatsappMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import { SITE_CONFIG } from "@/lib/constants";

interface CartSheetProps {
  whatsappNumber?: string;
}

// NEXT_PUBLIC_TURNSTILE_SITE_KEY tanımlıysa Turnstile zorunlu olur;
// tanımlı değilse (henüz kurulmadıysa) doğrulama otomatik geçilmiş sayılır.
const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function CartSheet({ whatsappNumber }: CartSheetProps) {
  const {
    items,
    customerName,
    customerNote,
    isOpen,
    setOpen,
    removeItem,
    updateQuantity,
    setCustomerName,
    setCustomerNote,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  const [isVerified, setIsVerified] = useState(!turnstileRequired);

  const number = whatsappNumber || SITE_CONFIG.whatsappNumber;
  const canSend = items.length > 0 && isVerified;

  function handleSendToWhatsapp() {
    if (!canSend) return;

    const message = buildWhatsappMessage({
      items,
      customerName: customerName.trim() || undefined,
      customerNote,
      siteUrl: window.location.origin,
    });
    const url = buildWhatsappUrl(number, message);

    window.open(url, "_blank", "noopener,noreferrer");

    // Gönderim sonrası sepeti temizle ve popover'ı kapat.
    clearCart();
    setOpen(false);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Sepetim{totalItems > 0 ? ` (${totalItems})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-gray-500">
            <ShoppingCart className="h-10 w-10 text-gray-300" />
            <p>Sepetiniz boş</p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
              {items.map((item) => {
                const effectiveUnitPrice = getEffectiveUnitPrice(
                  item.price,
                  item.quantity,
                  item.bulkTiers
                );
                const isDiscounted = effectiveUnitPrice < item.price;

                return (
                <div
                  key={item.id}
                  className="flex gap-3 border-b border-gray-100 pb-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                        Görsel yok
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/urun/${item.productSlug}`}
                      onClick={() => setOpen(false)}
                      className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-brand-navy"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {UNIT_LABELS[item.unitType] ?? item.unitType}
                      {item.piecesPerUnit
                        ? ` (${item.piecesPerUnit} adet)`
                        : ""}{" "}
                      · {formatPrice(effectiveUnitPrice)}
                      {isDiscounted && (
                        <span className="ml-1 text-green-600">
                          (toplu indirim)
                        </span>
                      )}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                          aria-label="Azalt"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                          aria-label="Artır"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-navy">
                          {formatPrice(effectiveUnitPrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-red-500 active:text-red-600"
                          aria-label="Kaldır"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Toplam</span>
                <span className="text-brand-navy">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <div>
                <label
                  htmlFor="customer-name"
                  className="text-sm font-medium text-gray-700"
                >
                  Ad Soyad{" "}
                  <span className="font-normal text-gray-400">
                    (opsiyonel)
                  </span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-note"
                  className="text-sm font-medium text-gray-700"
                >
                  Mesaj{" "}
                  <span className="font-normal text-gray-400">
                    (opsiyonel)
                  </span>
                </label>
                <textarea
                  id="customer-note"
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder="Eklemek istediğiniz bir not varsa buraya yazabilirsiniz"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <TurnstileWidget onVerified={setIsVerified} />

              <Button
                variant="accent"
                size="lg"
                className="w-full gap-2"
                disabled={!canSend}
                onClick={handleSendToWhatsapp}
              >
                WhatsApp&apos;a Gönder
              </Button>
              {turnstileRequired && !isVerified && (
                <p className="text-center text-xs text-gray-400">
                  Göndermek için yukarıdaki doğrulamayı tamamlayın.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
