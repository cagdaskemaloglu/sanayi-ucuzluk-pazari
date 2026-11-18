import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, Notice } from "@/components/features/account/auth-ui";
import { LoginForm } from "@/components/features/account/login-form";
import { getCurrentCustomerSession, isGoogleLoginEnabled } from "@/lib/auth/options";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Giriş Yap",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: { callbackUrl?: string; dogrulandi?: string; email?: string; hata?: string; error?: string; sifre?: string };
}

export default async function GirisPage({ searchParams }: PageProps) {
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);
  if (await getCurrentCustomerSession()) redirect(callbackUrl);

  let notice: { tone: "error" | "success"; text: string } | null = null;
  if (searchParams.dogrulandi) {
    notice = { tone: "success", text: "E-posta adresiniz doğrulandı. Şimdi giriş yapabilirsiniz." };
  } else if (searchParams.sifre === "yenilendi") {
    notice = { tone: "success", text: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz." };
  } else if (searchParams.hata === "dogrulama") {
    notice = { tone: "error", text: "Doğrulama linki geçersiz veya süresi dolmuş. Tekrar üye olmayı deneyerek yeni link alabilirsiniz." };
  } else if (searchParams.hata === "google-dogrulanmamis") {
    notice = { tone: "error", text: "Google hesabınızın e-posta adresi doğrulanmamış. Lütfen e-posta ve şifre ile üye olun." };
  } else if (searchParams.error) {
    notice = { tone: "error", text: "Giriş yapılamadı. Lütfen tekrar deneyin." };
  }

  return (
    <AuthCard title="Giriş Yap" subtitle="Siparişlerinizi takip etmek için hesabınıza giriş yapın.">
      {notice && (
        <div className="mb-4">
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      )}
      <LoginForm
        callbackUrl={callbackUrl}
        googleEnabled={isGoogleLoginEnabled()}
        initialEmail={searchParams.email}
      />
    </AuthCard>
  );
}
