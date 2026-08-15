"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h2 className="text-2xl font-bold text-brand-navy">
        Bir şeyler ters gitti
      </h2>
      <p className="text-gray-600">
        Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <Button variant="accent" onClick={() => reset()}>
        Tekrar Dene
      </Button>
    </div>
  );
}
