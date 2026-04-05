"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFAULT_INPUTS } from "@/lib/calc/defaults";
import { computeFireNumber } from "@/lib/calc/fireNumber";
import type { CityData } from "@/lib/calc/types";

export function CompareClient({
  cities,
  allSlugs,
}: {
  cities: CityData[];
  allSlugs: string[];
}) {
  const [selected, setSelected] = useState<string[]>(cities.map((city) => city.slug));
  const rows = cities.map((city) => ({
    city,
    result: computeFireNumber(city, DEFAULT_INPUTS, city.fx.referenceRateUsdPerLocal),
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
          Comparison mode
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">
          Compare city targets side by side
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-neutral-600">
          Baseline assumptions use the Comfortable Expat tier, couple household, central 1BR rent, no state tax, and a 3.25% SWR. Choose up to four cities for a quick ranking pass.
        </p>
      </header>

      <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
        <h2 className="text-sm font-semibold text-neutral-950">Select cities</h2>
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
            Refresh comparison
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-[0.16em] text-neutral-500">
              <th className="pb-3 pr-4">City</th>
              <th className="pb-3 pr-4">Annual spend</th>
              <th className="pb-3 pr-4">Gross withdrawal</th>
              <th className="pb-3 pr-4">Total tax</th>
              <th className="pb-3 pr-4">FIRE number</th>
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
                  $
                  {result.annualSpendUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="py-4 pr-4" title={sourceTitle}>
                  $
                  {result.grossWithdrawalUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="py-4 pr-4" title={sourceTitle}>
                  $
                  {result.taxBreakdown.totalTax.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="py-4 pr-4 font-semibold" title={sourceTitle}>
                  $
                  {result.fireNumberUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
