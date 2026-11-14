"use client";

import { QuantityInput } from "@/components/ui/quantity-input";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, ShoppingCart, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TurnstileWidget } from "@/components/features/cart/turnstile-widget";
import { useCart } from "@/lib/cart/cart-context";
import { UNIT_LABELS, formatPrice } from "@/lib/pricing";
import { buildWhatsappMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import { SITE_CONFIG } from "@/lib/constants";
import { calculateShippingFee, type ShippingSettings } from "@/lib/shipping";

interface CartSheetProps {
  whatsappNumber?: string;
  shipping?: ShippingSettings;
}

// NEXT_PUBLIC_TURNSTILE_SITE_KEY tanımlıysa Turnstile zorunlu olur;
// tanımlı değilse (henüz kurulmadıysa) doğrulama otomatik geçilmiş sayılır.
const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function CartSheet({ whatsappNumber, shipping }: CartSheetProps) {
  const {
    items,
    itemsWithVat,
    customerName,
    customerAddress,
    customerNote,
    isOpen,
    setOpen,
    removeItem,
    updateQuantity,
    setCustomerName,
    setCustomerAddress,
    setCustomerNote,
    clearCart,
    totalItems,
    totalPriceExcludingVat,
    totalVatAmount,
    totalPriceIncludingVat,
  } = useCart();

  const [isVerified, setIsVerified] = useState(!turnstileRequired);

  const number = whatsappNumber || SITE_CONFIG.whatsappNumber;
  // Online ödemede eklenecek kargo (WhatsApp siparişlerinde kargo ayrıca
  // konuşulduğu için WhatsApp tutarına eklenmez).
  const shippingFee = calculateShippingFee(totalPriceIncludingVat, shipping);
  const onlineTotal =
    Math.round((totalPriceIncludingVat + shippingFee) * 100) / 100;
  const canSend = items.length > 0 && isVerified;

  function handleSendToWhatsapp() {
    if (!canSend) return;

    const message = buildWhatsappMessage({
      items,
      customerName: customerName.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
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
              {itemsWithVat.map((item) => {
                const isDiscounted = item.effectiveUnitPrice < item.price;

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
                        · {formatPrice(item.effectiveUnitPrice)}{" "}
                        <span className="text-gray-400">(KDV hariç)</span>
                        {isDiscounted && (
                          <span className="ml-1 text-green-600">
                            (toplu indirim)
                          </span>
                        )}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <QuantityInput
                          value={item.quantity}
                          onChange={(quantity) =>
                            updateQuantity(item.id, quantity)
                          }
                          allowRemove
                          className="gap-1.5"
                          buttonClassName="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                          inputClassName="h-7 w-12 rounded border border-gray-200"
                          iconClassName="h-3 w-3"
                        />

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-navy">
                            {formatPrice(item.lineTotalExcludingVat)}
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
                  htmlFor="customer-address"
                  className="text-sm font-medium text-gray-700"
                >
                  Adres{" "}
                  <span className="font-normal text-gray-400">
                    (opsiyonel)
                  </span>
                </label>
                <textarea
                  id="customer-address"
                  value={customerAddress}
                  onChange={(event) => setCustomerAddress(event.target.value)}
                  placeholder="Teslimat adresi"
                  rows={2}
                  className="mt-1 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
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

              {/* WhatsApp'a Gönder — KDV HARİÇ toplamı gösterir, WhatsApp
                  yeşilinde. Sipariş/teklif talebi bu buton ile iletilir. */}
              <button
                type="button"
                disabled={!canSend}
                onClick={handleSendToWhatsapp}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-green-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:pointer-events-none disabled:opacity-50"
              >
                WhatsApp&apos;a Gönder — {formatPrice(totalPriceExcludingVat)}{" "}
                <span className="font-normal">(KDV hariç)</span>
              </button>
              {turnstileRequired && !isVerified && (
                <p className="text-center text-xs text-gray-400">
                  Göndermek için yukarıdaki doğrulamayı tamamlayın.
                </p>
              )}

              {/* KDV dökümü — her ürünün KDV'si ayrı satırda, altında
                  KDV dahil genel toplamı gösteren Online Öde butonu. */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">
                  Ürün Bazında KDV
                </p>
                <div className="mt-2 space-y-1">
                  {itemsWithVat.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs text-gray-600"
                    >
                      <span className="line-clamp-1 pr-2">
                        {item.productName} ({UNIT_LABELS[item.unitType] ?? item.unitType} x{" "}
                        {item.quantity}) — KDV %{item.vatRate ?? 20}
                      </span>
                      <span className="shrink-0 font-medium text-gray-700">
                        {formatPrice(item.vatAmount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs text-gray-500">
                  <span>Toplam KDV</span>
                  <span className="font-medium text-gray-700">
                    {formatPrice(totalVatAmount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>Kargo (online ödemede)</span>
                  <span className="font-medium text-gray-700">
                    {shippingFee > 0 ? formatPrice(shippingFee) : "Ücretsiz"}
                  </span>
                </div>
              </div>

              {/* Online Öde — KDV DAHİL genel toplamı gösterir, /odeme
                  sayfasına yönlendirir (PayTR iFrame akışı). */}
              <Link
                href="/odeme"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark"
              >
                <CreditCard className="h-4 w-4" />
                Online Öde — {formatPrice(onlineTotal)}{" "}
                <span className="font-normal">
                  ({shippingFee > 0 ? "KDV ve kargo dahil" : "KDV dahil"})
                </span>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
