"use client";

import Script from "next/script";

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, target: string) => unknown;
  }
}

interface PaytrCheckoutFrameProps {
  token: string;
}

// PayTR'nin kendi barındırdığı ödeme formunu iframe ile gömer — kart bilgileri
// bu sitenin sunucusundan/sayfasından hiç geçmez. iframeResizer, formun
// yüksekliğini içeriğe göre otomatik ayarlar (PayTR dokümantasyonundaki yöntem).
export function PaytrCheckoutFrame({ token }: PaytrCheckoutFrameProps) {
  return (
    <>
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onReady={() => window.iFrameResize?.({}, "#paytriframe")}
      />
      <iframe
        id="paytriframe"
        title="PayTR güvenli ödeme"
        src={`https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`}
        frameBorder="0"
        scrolling="no"
        style={{ width: "100%", minHeight: 480 }}
      />
    </>
  );
}
