import type { Metadata } from "next";
import { AuthCard } from "@/components/features/account/auth-ui";
import { ResetPasswordForm } from "@/components/features/account/reset-password-form";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
  robots: { index: false, follow: false },
  // Link e-postadaki kodu içerir; başka sitelere Referer ile sızmasın.
  referrer: "no-referrer",
};

export default function SifreSifirlaPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <AuthCard title="Yeni Şifre Belirle">
      <ResetPasswordForm token={searchParams.token ?? ""} />
    </AuthCard>
  );
}
