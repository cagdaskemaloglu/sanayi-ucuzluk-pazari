"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { CART_STORAGE_KEY } from "@/lib/constants";
import { getEffectiveUnitPrice, getVatAmount } from "@/lib/pricing";
import type { CartItem } from "./types";

interface CartState {
  items: CartItem[];
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerNote: string;
  isOpen: boolean;
}

type AddItemPayload = Omit<CartItem, "quantity"> & { quantity?: number };

type CartAction =
  | { type: "ADD_ITEM"; payload: AddItemPayload }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_CUSTOMER_NAME"; payload: string }
  | { type: "SET_CUSTOMER_ADDRESS"; payload: string }
  | { type: "SET_CUSTOMER_PHONE"; payload: string }
  | { type: "SET_CUSTOMER_NOTE"; payload: string }
  | { type: "CLEAR_CART" }
  | { type: "SET_OPEN"; payload: boolean }
  | {
      type: "HYDRATE";
      payload: {
        items: CartItem[];
        customerName: string;
        customerAddress: string;
        customerPhone: string;
        customerNote: string;
      };
    };

const initialState: CartState = {
  items: [],
  customerName: "",
  customerAddress: "",
  customerPhone: "",
  customerNote: "",
  isOpen: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        items: action.payload.items,
        customerName: action.payload.customerName,
        customerAddress: action.payload.customerAddress,
        customerPhone: action.payload.customerPhone,
        customerNote: action.payload.customerNote,
      };

    case "ADD_ITEM": {
      const quantity = action.payload.quantity ?? 1;
      const existing = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
          isOpen: true,
        };
      }

      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity }],
        isOpen: true,
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.id !== action.payload.id
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case "SET_CUSTOMER_NAME":
      return { ...state, customerName: action.payload };

    case "SET_CUSTOMER_ADDRESS":
      return { ...state, customerAddress: action.payload };

    case "SET_CUSTOMER_PHONE":
      return { ...state, customerPhone: action.payload };

    case "SET_CUSTOMER_NOTE":
      return { ...state, customerNote: action.payload };

    case "CLEAR_CART":
      return { ...state, items: [], customerNote: "" };

    case "SET_OPEN":
      return { ...state, isOpen: action.payload };

    default:
      return state;
  }
}

export interface CartItemWithVat extends CartItem {
  effectiveUnitPrice: number;
  lineTotalExcludingVat: number;
  vatAmount: number;
  lineTotalIncludingVat: number;
}

interface CartContextValue {
  items: CartItem[];
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerNote: string;
  isOpen: boolean;
  /** localStorage'dan sepet geri yüklendi mi (ilk render'da false). */
  hydrated: boolean;
  addItem: (item: AddItemPayload) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  setCustomerAddress: (address: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerNote: (note: string) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  totalItems: number;
  /** KDV HARİÇ ara toplam (WhatsApp'a gönder butonunda kullanılır) */
  totalPriceExcludingVat: number;
  /** Sadece KDV tutarı */
  totalVatAmount: number;
  /** KDV DAHİL genel toplam (Online Öde butonunda kullanılır) */
  totalPriceIncludingVat: number;
  /** Her ürün için hesaplanmış KDV detayları (sepet listesinde gösterim için) */
  itemsWithVat: CartItemWithVat[];
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // İlk yüklemede sepeti localStorage'dan geri getir.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({
          type: "HYDRATE",
          payload: {
            items: parsed.items ?? [],
            customerName: parsed.customerName ?? "",
            customerAddress: parsed.customerAddress ?? "",
            customerPhone: parsed.customerPhone ?? "",
            customerNote: parsed.customerNote ?? "",
          },
        });
      }
    } catch {
      // localStorage okunamazsa sessizce boş sepetle devam et.
    } finally {
      setHydrated(true);
    }
  }, []);

  // Değişiklikleri localStorage'a yaz. Hydrate tamamlanmadan yazmıyoruz,
  // yoksa ilk render'daki boş state kayıtlı sepeti ezer.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          items: state.items,
          customerName: state.customerName,
          customerAddress: state.customerAddress,
          customerPhone: state.customerPhone,
          customerNote: state.customerNote,
        })
      );
    } catch {
      // localStorage yazılamazsa sessizce yut, kritik değil.
    }
  }, [
    state.items,
    state.customerName,
    state.customerAddress,
    state.customerPhone,
    state.customerNote,
    hydrated,
  ]);

  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const itemsWithVat = useMemo<CartItemWithVat[]>(
    () =>
      state.items.map((item) => {
        const effectiveUnitPrice = getEffectiveUnitPrice(
          item.price,
          item.quantity,
          item.bulkTiers
        );
        const lineTotalExcludingVat = effectiveUnitPrice * item.quantity;
        const vatAmount = getVatAmount(lineTotalExcludingVat, item.vatRate);
        return {
          ...item,
          effectiveUnitPrice,
          lineTotalExcludingVat,
          vatAmount,
          lineTotalIncludingVat: lineTotalExcludingVat + vatAmount,
        };
      }),
    [state.items]
  );

  const totalPriceExcludingVat = useMemo(
    () => itemsWithVat.reduce((sum, item) => sum + item.lineTotalExcludingVat, 0),
    [itemsWithVat]
  );

  const totalVatAmount = useMemo(
    () => itemsWithVat.reduce((sum, item) => sum + item.vatAmount, 0),
    [itemsWithVat]
  );

  const totalPriceIncludingVat = totalPriceExcludingVat + totalVatAmount;

  const value: CartContextValue = {
    items: state.items,
    customerName: state.customerName,
    customerAddress: state.customerAddress,
    customerPhone: state.customerPhone,
    customerNote: state.customerNote,
    isOpen: state.isOpen,
    hydrated,
    addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
    removeItem: (id) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
    updateQuantity: (id, quantity) =>
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } }),
    setCustomerName: (name) =>
      dispatch({ type: "SET_CUSTOMER_NAME", payload: name }),
    setCustomerAddress: (address) =>
      dispatch({ type: "SET_CUSTOMER_ADDRESS", payload: address }),
    setCustomerPhone: (phone) =>
      dispatch({ type: "SET_CUSTOMER_PHONE", payload: phone }),
    setCustomerNote: (note) =>
      dispatch({ type: "SET_CUSTOMER_NOTE", payload: note }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
    setOpen: (open) => dispatch({ type: "SET_OPEN", payload: open }),
    totalItems,
    totalPriceExcludingVat,
    totalVatAmount,
    totalPriceIncludingVat,
    itemsWithVat,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart, CartProvider içinde kullanılmalı");
  }
  return context;
}
