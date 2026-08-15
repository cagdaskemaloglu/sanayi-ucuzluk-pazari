import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h2 className="text-4xl font-bold text-brand-navy">404</h2>
      <p className="text-gray-600">Aradığınız sayfa bulunamadı.</p>
      <Button variant="accent" asChild>
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  );
}
