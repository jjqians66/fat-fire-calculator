export function InputSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-black/10 bg-white/85 p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
