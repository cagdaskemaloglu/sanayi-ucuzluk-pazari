interface LegalPageLayoutProps {
  title: string;
  updatedLabel?: string;
  children: React.ReactNode;
}

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

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Bu sayfa bir şablon metindir; işletmenize özel yasal gereklilikleri
        tam karşılamayabilir. Yayına almadan önce bir hukuk danışmanına
        onaylatmanızı öneririz.
      </div>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </div>
  );
}
