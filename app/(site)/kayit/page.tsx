import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/features/account/auth-ui";
import { RegisterForm } from "@/components/features/account/register-form";
import { getCurrentCustomerSession, isGoogleLoginEnabled } from "@/lib/auth/options";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Üye Ol",
  robots: { index: false, follow: false },
};

export default async function KayitPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);
  if (await getCurrentCustomerSession()) redirect(callbackUrl);

  return (
    <AuthCard title="Üye Ol" subtitle="Siparişlerinizi ve sipariş geçmişinizi tek yerden takip edin.">
      <RegisterForm callbackUrl={callbackUrl} googleEnabled={isGoogleLoginEnabled()} />
    </AuthCard>
  );
}
