"use client";

import { createContext, useContext } from "react";
import type { DeliverySettings } from "@/lib/delivery";
import type { ShippingSettings } from "@/lib/shipping";

// Sanity Site Ayarları'ndan, istemci bileşenlerinin (ürün kartı, sepet vb.)
// ihtiyaç duyduğu birkaç değer. app/(site)/layout.tsx'te bir kez sağlanır;
// böylece her bileşene ayrı ayrı prop olarak taşımak gerekmez.
export interface StoreSettings {
  delivery: DeliverySettings;
  shipping: ShippingSettings;
}

const StoreSettingsContext = createContext<StoreSettings>({
  delivery: {},
  shipping: {},
});

export function StoreSettingsProvider({
  value,
  children,
}: {
  value: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
