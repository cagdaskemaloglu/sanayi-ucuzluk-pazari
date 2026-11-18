import { requireWriteClient } from "./customers";
import { normalizeEmail } from "./password";

// Üyenin siparişleri. Eşleşme: siparişe bağlı üye kimliği VEYA siparişteki
// e-posta (üye olmadan önce aynı e-postayla verilmiş siparişler de görünür).
// E-posta eşleşmesi güvenlidir çünkü oturum yalnızca doğrulanmış e-postayla
// açılabilir (şifreli hesaplarda doğrulama linki, Google'da Google doğrular).
// Ödemesi tamamlanmamış (pending) ve başarısız (failed) denemeler gösterilmez.

const VISIBLE_STATUSES = ["paid", "preparing", "shipped", "delivered", "cancelled"];

const OWNERSHIP_FILTER = `_type == "order"
  && status in $statuses
  && (customer._ref == $customerId || lower(customerEmail) == $email)`;

export interface CustomerOrderSummary {
  orderNumber: string;
  status: string;
  createdAt: string;
  grandTotal?: number;
  totalIncludingVat?: number;
  itemCount: number;
  firstItemName?: string;
}

export interface CustomerOrderDetail {
  orderNumber: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  customerName: string;
  customerSurname: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  customerDistrict?: string;
  customerAddress: string;
  customerTaxNumber?: string;
  items: { productName: string; unitLabel: string; quantity: number; unitPrice: number; lineTotal: number }[];
  totalExcludingVat?: number;
  totalVat?: number;
  totalIncludingVat: number;
  shippingFee?: number;
  grandTotal?: number;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

function params(customer: { id: string; email: string }) {
  return { customerId: customer.id, email: normalizeEmail(customer.email), statuses: VISIBLE_STATUSES };
}

export async function getCustomerOrders(customer: { id: string; email: string }): Promise<CustomerOrderSummary[]> {
  return requireWriteClient().fetch(
    `*[${OWNERSHIP_FILTER}] | order(_createdAt desc) [0...100] {
      orderNumber, status, "createdAt": _createdAt, grandTotal, totalIncludingVat,
      "itemCount": count(items), "firstItemName": items[0].productName
    }`,
    params(customer)
  );
}

export async function getCustomerOrder(
  customer: { id: string; email: string },
  orderNumber: string
): Promise<CustomerOrderDetail | null> {
  return requireWriteClient().fetch(
    `*[${OWNERSHIP_FILTER} && orderNumber == $orderNumber][0] {
      orderNumber, status, "createdAt": _createdAt, paidAt,
      customerName, customerSurname, customerPhone, customerEmail,
      customerCity, customerDistrict, customerAddress, customerTaxNumber,
      items[]{ productName, unitLabel, quantity, unitPrice, lineTotal },
      totalExcludingVat, totalVat, totalIncludingVat, shippingFee, grandTotal,
      carrier, trackingNumber, trackingUrl
    }`,
    { ...params(customer), orderNumber }
  );
}
