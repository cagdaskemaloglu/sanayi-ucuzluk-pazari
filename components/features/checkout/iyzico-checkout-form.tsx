"use client";

import { useEffect, useRef } from "react";

interface IyzicoCheckoutFormProps {
  checkoutFormContent: string;
}

// iyzico'nun checkoutFormInitialize API'si bize bir <script>...</script>
// bloğu döner; bu script çalıştığında sayfaya iyzico'nun kendi (kart
// bilgilerini bizim sunucumuza hiç değdirmeyen) ödeme formunu render eder.
// React'in dangerouslySetInnerHTML'i <script> içeriğini güvenlik nedeniyle
// otomatik ÇALIŞTIRMAZ — bu yüzden script içeriğini manuel olarak yeni bir
// <script> elemanına taşıyıp DOM'a ekliyoruz.
export function IyzicoCheckoutForm({
  checkoutFormContent,
}: IyzicoCheckoutFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !checkoutFormContent) return;

    container.innerHTML = "";

    const scriptMatch = checkoutFormContent.match(
      /<script[^>]*>([\s\S]*?)<\/script>/i
    );
    const scriptContent = scriptMatch ? scriptMatch[1] : checkoutFormContent;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.text = scriptContent;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [checkoutFormContent]);

  return (
    <div
      ref={containerRef}
      id="iyzipay-checkout-form"
      className="w-full min-h-[500px]"
    />
  );
}
