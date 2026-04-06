"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_INPUTS } from "@/lib/calc/defaults";
import { computeFireNumber } from "@/lib/calc/fireNumber";
import { fetchUsdRate } from "@/lib/fx/fetchRates";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { CityData } from "@/lib/calc/types";

export function CompareClient({
  cities,
  allSlugs,
}: {
  cities: CityData[];
  allSlugs: string[];
}) {
  const { t, locale } = useLocale();
  const displayLocale = locale === "zh" ? "zh-CN" : "en-US";
  const formatUsdValue = (value: number) =>
    `$${value.toLocaleString(displayLocale, { maximumFractionDigits: 0 })}`;
  const [selected, setSelected] = useState<string[]>(cities.map((city) => city.slug));
  const [fxByCity, setFxByCity] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      cities.map((city) => [city.slug, city.fx.referenceRateUsdPerLocal])
    )
  );

  useEffect(() => {
    let active = true;

    Promise.all(
      cities.map(async (city) => [
        city.slug,
        await fetchUsdRate(city.currency, city.fx.referenceRateUsdPerLocal),
      ])
    ).then((entries) => {
      if (!active) {
        return;
      }

      setFxByCity(Object.fromEntries(entries));
    });

    return () => {
      active = false;
    };
  }, [cities]);

  const rows = cities.map((city) => ({
    city,
    result: computeFireNumber(
      city,
      DEFAULT_INPUTS,
      fxByCity[city.slug] ?? city.fx.referenceRateUsdPerLocal
    ),
    sourceTitle: city.sources.join(" · "),
  }));

  function toggleCity(slug: string) {
    if (selected.includes(slug)) {
      setSelected(selected.filter((entry) => entry !== slug));
      return;
    }
    if (selected.length < 4) {
      setSelected([...selected, slug]);
    }
  }

  const query = selected.join(",");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
          {t.compare.kicker}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">
          {t.compare.title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-neutral-600">
          {t.compare.subtitle}
        </p>
      </header>

      <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
        <h2 className="text-sm font-semibold text-neutral-950">
          {t.compare.selectCities}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {allSlugs.map((slug) => {
            const active = selected.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleCity(slug)}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-black/10 bg-white text-neutral-700 hover:border-black/20"
                }`}
              >
                {slug}
              </button>
            );
          })}
          <Link
            href={`/compare?cities=${query}`}
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {t.compare.refresh}
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-[0.16em] text-neutral-500">
              <th className="pb-3 pr-4">{t.compare.city}</th>
              <th className="pb-3 pr-4">{t.compare.annualSpend}</th>
              <th className="pb-3 pr-4">{t.compare.grossWithdrawal}</th>
              <th className="pb-3 pr-4">{t.compare.totalTax}</th>
              <th className="pb-3 pr-4">{t.compare.fireNumber}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ city, result, sourceTitle }) => (
              <tr key={city.slug} className="border-b border-black/5 text-sm text-neutral-800">
                <td className="py-4 pr-4">
                  <Link href={`/city/${city.slug}`} className="font-semibold hover:text-[var(--accent)]">
                    {city.name}
                  </Link>
                </td>
                <td className="py-4 pr-4" title={sourceTitle}>
                  {formatUsdValue(result.annualSpendUsd)}
                </td>
                <td className="py-4 pr-4" title={sourceTitle}>
                  {formatUsdValue(result.grossWithdrawalUsd)}
                </td>
                <td className="py-4 pr-4" title={sourceTitle}>
                  {formatUsdValue(result.taxBreakdown.totalTax)}
                </td>
                <td className="py-4 pr-4 font-semibold" title={sourceTitle}>
                  {formatUsdValue(result.fireNumberUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
