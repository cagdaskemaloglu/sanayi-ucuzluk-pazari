"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { verifyTurnstileToken } from "@/app/actions/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  /** Kod burada (sunucu eylemiyle) doğrulanır; sonucu bildirir. */
  onVerified?: (verified: boolean) => void;
  /**
   * Verilirse kod burada DOĞRULANMAZ, ham hâliyle iletilir — doğrulamayı
   * formun gönderildiği API rotası yapar (Turnstile kodları tek kullanımlık).
   */
  onToken?: (token: string | null) => void;
}

// NEXT_PUBLIC_TURNSTILE_SITE_KEY tanımlı değilse bu bileşen hiçbir şey
// göstermez — Turnstile henüz kurulmadıysa sepet akışını engellemez.
export function TurnstileWidget({ onVerified, onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!scriptLoaded || !siteKey || !containerRef.current || !window.turnstile) {
      return;
    }

    window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: async (token: string) => {
        if (onToken) {
          onToken(token);
          return;
        }
        const result = await verifyTurnstileToken(token);
        onVerified?.(result.success);
      },
      "expired-callback": () => (onToken ? onToken(null) : onVerified?.(false)),
      "error-callback": () => (onToken ? onToken(null) : onVerified?.(false)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} className="mt-2" />
    </>
  );
}
