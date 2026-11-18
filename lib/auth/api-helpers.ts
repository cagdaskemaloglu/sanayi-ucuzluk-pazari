import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/app/actions/turnstile";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { SITE_CONFIG } from "@/lib/constants";

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function str(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Turnstile kuruluysa doğrular; kurulu değilse geçer (mevcut sepet davranışıyla aynı). */
export async function passesBotCheck(token: unknown): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  if (typeof token !== "string" || !token) return false;
  return (await verifyTurnstileToken(token)).success;
}

export async function getShopName(): Promise<string> {
  const settings = await getSiteSettings().catch(() => null);
  return settings?.siteTitle || SITE_CONFIG.name;
}
