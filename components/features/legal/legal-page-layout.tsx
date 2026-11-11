interface LegalPageLayoutProps {
  title: string;
  updatedLabel?: string;
  children: React.ReactNode;
}

// Not: Yasal metinler şablondur; canlıya almadan önce bir hukuk
// danışmanına kontrol ettirilmesi önerilir. (Eskiden ziyaretçiye görünen
// "şablon metin" uyarısı, canlı sitede güven sorunu yaratmasın diye kaldırıldı.)
export function LegalPageLayout({
  title,
  updatedLabel,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-navy">{title}</h1>
      {updatedLabel && (
        <p className="mt-1 text-xs text-gray-400">{updatedLabel}</p>
      )}

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </div>
  );
}
