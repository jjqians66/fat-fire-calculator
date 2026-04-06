"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { CityCard } from "./CityCard";

interface CitySummary {
  slug: string;
  name: string;
  country: string;
  currency: string;
  lastUpdated: string;
  baselineFireNumberUsd: number;
}

export function HomeCityBrowser({ cities }: { cities: CitySummary[] }) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const filtered = cities.filter((city) => {
    const needle = `${city.name} ${city.country}`.toLowerCase();
    return needle.includes(query.toLowerCase());
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-950">
            {t.home.chooseCity}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {t.home.chooseCityDesc}
          </p>
        </div>
        <label className="block min-w-[18rem]">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
            {t.home.search}
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-neutral-400 focus:border-[var(--accent)]"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((city) => (
          <CityCard key={city.slug} {...city} />
        ))}
      </div>
    </section>
  );
}
