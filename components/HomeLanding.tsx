"use client";

import { HomeCityBrowser } from "@/components/HomeCityBrowser";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface CitySummary {
  slug: string;
  name: string;
  country: string;
  currency: string;
  lastUpdated: string;
  baselineFireNumberUsd: number;
}

export function HomeLanding({ cities }: { cities: CitySummary[] }) {
  const { t } = useLocale();

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          <p className="inline-flex rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-neutral-600">
            {t.home.kicker}
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
            {t.home.title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-neutral-700">
            {t.home.subtitle}
          </p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <p className="text-sm font-medium text-neutral-500">
            {t.home.strengthsTitle}
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
            {t.home.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
      <HomeCityBrowser cities={cities} />
    </div>
  );
}
