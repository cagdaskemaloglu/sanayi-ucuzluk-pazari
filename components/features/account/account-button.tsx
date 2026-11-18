"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";

// Header'daki hesap butonu: giriş yapılmamışsa "Giriş Yap", yapılmışsa
// "Hesabım" (geniş ekranda üyenin adı).
export function AccountButton() {
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <Link
      href={loggedIn ? "/hesabim" : "/giris"}
      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-sm font-medium text-brand-navy transition-colors hover:bg-gray-50"
      aria-label={loggedIn ? "Hesabım" : "Giriş yap veya üye ol"}
    >
      <User className="h-5 w-5" />
      <span className="hidden max-w-[120px] truncate sm:inline">
        {status === "loading" ? "Hesabım" : loggedIn ? firstName || "Hesabım" : "Giriş Yap"}
      </span>
    </Link>
  );
}
