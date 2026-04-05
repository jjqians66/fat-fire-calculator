import Link from "next/link";

interface CityCardProps {
  slug: string;
  name: string;
  country: string;
  currency: string;
  lastUpdated: string;
  baselineFireNumberUsd: number;
}

export function CityCard({
  slug,
  name,
  country,
  currency,
  lastUpdated,
  baselineFireNumberUsd,
}: CityCardProps) {
  return (
    <Link
      href={`/city/${slug}`}
      className="group block rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.55)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_28px_80px_-46px_rgba(15,23,42,0.62)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-950">{name}</h3>
          <p className="mt-1 text-sm text-neutral-600">
            {country} · {currency}
          </p>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
          {lastUpdated}
        </span>
      </div>
      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
          Baseline target
        </p>
        <p className="mt-2 text-2xl font-semibold text-neutral-950">
          $
          {baselineFireNumberUsd.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-neutral-600">
        <span>Open calculator</span>
        <span className="transition group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
