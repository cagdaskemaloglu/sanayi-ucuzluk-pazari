"use client";

import { MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

interface WhatsappFloatingButtonProps {
  whatsappNumber?: string;
}

// Sağ altta sabit (fixed) WhatsApp butonu. Scroll'da konumu değişmez.
// Numara önce Sanity siteSettings'ten gelir, yoksa lib/constants.ts'teki
// placeholder'a düşer.
export function WhatsappFloatingButton({
  whatsappNumber,
}: WhatsappFloatingButtonProps) {
  const number = whatsappNumber || SITE_CONFIG.whatsappNumber;
  const href = `https://wa.me/${number}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:scale-105 hover:bg-green-600"
      aria-label="WhatsApp ile iletişime geç"
    >
      <MessageCircle className="h-7 w-7" fill="white" />
    </a>
  );
}
