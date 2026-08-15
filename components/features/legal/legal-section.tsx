interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="text-base font-semibold text-brand-navy">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
