import { useLocale } from "@/lib/i18n/LocaleProvider";

export function InputSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <details
      open
      className="rounded-[24px] border border-black/10 bg-white/85 p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {description}
              </p>
            ) : null}
          </div>
          <span className="pt-0.5 text-xs uppercase tracking-[0.18em] text-neutral-400">
            {t.ui.toggle}
          </span>
        </div>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}
