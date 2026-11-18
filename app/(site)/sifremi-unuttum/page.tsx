import type { Metadata } from "next";
import { AuthCard } from "@/components/features/account/auth-ui";
import { ForgotPasswordForm } from "@/components/features/account/forgot-password-form";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false, follow: false },
};

export default function SifremiUnuttumPage() {
  return (
    <AuthCard
      title="Şifremi Unuttum"
      subtitle="Üyelik e-posta adresinizi girin, size yeni şifre belirleme linki gönderelim. Google ile üye olduysanız da buradan şifre belirleyebilirsiniz."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
