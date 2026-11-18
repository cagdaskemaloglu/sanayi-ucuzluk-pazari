import { randomUUID } from "node:crypto";
import { getWriteClient } from "@/lib/sanity/write-client";
import { normalizeEmail } from "./password";

// Üye kayıtlarına erişim — SADECE sunucu tarafında (API route, NextAuth,
// server component). Yazma token'ı (SANITY_API_TOKEN) ile çalışır.

export interface CustomerRecord {
  _id: string;
  _rev: string;
  name?: string;
  email: string;
  emailVerified?: string;
  authProviders?: string[];
  phone?: string;
  city?: string;
  district?: string;
  address?: string;
  taxNumber?: string;
  passwordHash?: string;
  googleId?: string;
  verifyTokenHash?: string;
  verifyTokenExpires?: string;
  resetTokenHash?: string;
  resetTokenExpires?: string;
  failedLoginCount?: number;
  lockedUntil?: string;
}

/** Hesabım sayfasında ve ödeme formunda kullanılan, gizli alan içermeyen profil. */
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  taxNumber: string;
  hasPassword: boolean;
  hasGoogle: boolean;
}

const CUSTOMER_FIELDS = `_id, _rev, name, email, emailVerified, authProviders, phone, city,
  district, address, taxNumber, passwordHash, googleId, verifyTokenHash,
  verifyTokenExpires, resetTokenHash, resetTokenExpires, failedLoginCount, lockedUntil`;

export function requireWriteClient() {
  const client = getWriteClient();
  if (!client) {
    throw new Error("SANITY_API_TOKEN tanımlı değil; üyelik işlemleri yapılamıyor.");
  }
  return client;
}

export async function findCustomerByEmail(email: string): Promise<CustomerRecord | null> {
  return requireWriteClient().fetch(
    `*[_type == "customer" && email == $email][0]{ ${CUSTOMER_FIELDS} }`,
    { email: normalizeEmail(email) }
  );
}

export async function findCustomerById(id: string): Promise<CustomerRecord | null> {
  return requireWriteClient().fetch(
    `*[_type == "customer" && _id == $id][0]{ ${CUSTOMER_FIELDS} }`,
    { id }
  );
}

export async function findCustomerByTokenHash(
  field: "verifyTokenHash" | "resetTokenHash",
  tokenHash: string
): Promise<CustomerRecord | null> {
  return requireWriteClient().fetch(
    `*[_type == "customer" && ${field} == $tokenHash][0]{ ${CUSTOMER_FIELDS} }`,
    { tokenHash }
  );
}

export async function createCustomer(
  data: Omit<Partial<CustomerRecord>, "_id" | "_rev"> & { email: string }
): Promise<CustomerRecord> {
  const doc = {
    _id: `customer.${randomUUID()}`,
    _type: "customer",
    ...data,
    email: normalizeEmail(data.email),
  };
  return requireWriteClient().create(doc) as unknown as Promise<CustomerRecord>;
}

export function toProfile(customer: CustomerRecord): CustomerProfile {
  return {
    id: customer._id,
    name: customer.name ?? "",
    email: customer.email,
    phone: customer.phone ?? "",
    city: customer.city ?? "",
    district: customer.district ?? "",
    address: customer.address ?? "",
    taxNumber: customer.taxNumber ?? "",
    hasPassword: Boolean(customer.passwordHash),
    hasGoogle: Boolean(customer.googleId),
  };
}

export function isExpired(iso?: string): boolean {
  return !iso || new Date(iso).getTime() < Date.now();
}
