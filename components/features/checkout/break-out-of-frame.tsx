"use client";

import { useEffect } from "react";

// PayTR iframe'i, ödeme bitince müşteriyi bizim sonuç sayfamıza iframe'in
// İÇİNDE yönlendirir. Bu sayfa bir iframe içinde açılmışsa, aynı adresi
// üst pencerede (tam ekran) açar. Üst pencere ile iframe aynı site olduğu
// için tarayıcı buna izin verir; iframe'de değilsek hiçbir şey yapmaz.
export function BreakOutOfFrame() {
  useEffect(() => {
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.href = window.self.location.href;
      } catch {
        // Üst pencereye erişilemezse sayfa iframe içinde kalır, sorun değil.
      }
    }
  }, []);

  return null;
}
