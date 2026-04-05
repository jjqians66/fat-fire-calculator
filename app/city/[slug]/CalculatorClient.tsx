"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { InputSection } from "@/components/inputs/InputSection";
import { Select } from "@/components/inputs/Select";
import { computeHousing } from "@/lib/calc/housing";
import { applyHouseholdProfile } from "@/lib/calc/household";
import { computeFireNumber } from "@/lib/calc/fireNumber";
import { DEFAULT_INPUTS } from "@/lib/calc/defaults";
import { fetchUsdRate } from "@/lib/fx/fetchRates";
import { stateTax } from "@/lib/calc/taxData";
import type { CalcInputs, CityData, TierCosts } from "@/lib/calc/types";

const SpendChart = dynamic(
  () =>
    import("@/components/results/SpendChart").then((module) => module.SpendChart),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
        <h3 className="text-sm font-semibold text-neutral-950">
          Annual spend by category
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Baseline preset vs your current overrides, converted to USD.
        </p>
        <div className="mt-4 h-[360px] animate-pulse rounded-[20px] bg-neutral-100" />
      </div>
    ),
  }
);

const TaxBreakdownChart = dynamic(
  () =>
    import("@/components/results/TaxBreakdownChart").then(
      (module) => module.TaxBreakdownChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
        <h3 className="text-sm font-semibold text-neutral-950">
          Gross withdrawal composition
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          See how much of the gross annual draw becomes spendable net cash.
        </p>
        <div className="mt-4 h-[220px] animate-pulse rounded-[20px] bg-neutral-100" />
      </div>
    ),
  }
);

const tierOptions = [
  { value: "comfortable_expat", label: "Comfortable Expat" },
  { value: "true_fat_fire", label: "True Fat FIRE" },
  { value: "luxury_family", label: "Luxury Family" },
] as const;

const householdOptions = [
  { value: "single", label: "Single" },
  { value: "couple", label: "Couple (no kids)" },
  { value: "family", label: "Family with kids" },
] as const;

const housingModeOptions = [
  { value: "rent", label: "Rent" },
  { value: "own", label: "Own" },
] as const;

const housingAreaOptions = [
  { value: "central", label: "Central" },
  { value: "suburb", label: "Suburb" },
] as const;

const housingSizeOptions = [
  { value: "1br", label: "1 BR" },
  { value: "3br", label: "3 BR" },
] as const;

const withdrawalStrategyOptions = [
  { value: "proportional", label: "Proportional" },
  { value: "tax_optimal", label: "Tax-optimal" },
] as const;

type EditableCategoryKey = Exclude<keyof TierCosts, "description">;

const editableCategories: Array<{
  key: EditableCategoryKey;
  label: string;
  step: number;
}> = [
  { key: "groceries_monthly", label: "Groceries / month", step: 100 },
  { key: "dining_out_monthly", label: "Dining out / month", step: 100 },
  { key: "transport_monthly", label: "Transport / month", step: 100 },
  { key: "healthcare_monthly", label: "Healthcare / month", step: 100 },
  { key: "utilities_monthly", label: "Utilities / month", step: 50 },
  { key: "internet_mobile_monthly", label: "Internet + mobile / month", step: 50 },
  { key: "entertainment_monthly", label: "Entertainment / month", step: 100 },
  { key: "personal_services_monthly", label: "Personal services / month", step: 100 },
  { key: "domestic_help_monthly", label: "Domestic help / month", step: 100 },
  { key: "luxury_misc_monthly", label: "Luxury misc / month", step: 100 },
  { key: "education_annual", label: "Education / year", step: 1000 },
  { key: "travel_annual", label: "Travel / year", step: 1000 },
  { key: "legal_tax_compliance_annual", label: "Legal / tax / year", step: 500 },
  { key: "visa_residency_annual", label: "Visa / residency / year", step: 500 },
  { key: "contingency_pct", label: "Contingency %", step: 0.01 },
];

function mergeInputs(base: CalcInputs, parsed: Partial<CalcInputs>): CalcInputs {
  return {
    ...base,
    ...parsed,
    portfolio: {
      ...base.portfolio,
      ...(parsed.portfolio ?? {}),
    },
    categoryOverrides: {
      ...base.categoryOverrides,
      ...(parsed.categoryOverrides ?? {}),
    },
  };
}

function decodeQueryState(raw: string | null): Partial<CalcInputs> | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(atob(raw))) as Partial<CalcInputs>;
  } catch {
    return null;
  }
}

function encodeQueryState(inputs: CalcInputs) {
  return btoa(encodeURIComponent(JSON.stringify(inputs)));
}

function formatCurrency(
  value: number,
  currency: string,
  locale: string,
  maximumFractionDigits = 0
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}

export function CalculatorClient({
  city,
  initialQueryState,
}: {
  city: CityData;
  initialQueryState: string | null;
}) {
  const [inputs, setInputs] = useState<CalcInputs>(() => {
    const parsedQuery = decodeQueryState(initialQueryState);
    if (typeof window === "undefined") {
      return mergeInputs(DEFAULT_INPUTS, parsedQuery ?? {});
    }
    const localState = decodeQueryState(
      window.localStorage.getItem(`fat-fire:${city.slug}`)
    );
    return mergeInputs(DEFAULT_INPUTS, parsedQuery ?? localState ?? {});
  });
  const [fx, setFx] = useState(city.fx.referenceRateUsdPerLocal);
  const [compareCities, setCompareCities] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const compareList = window.localStorage.getItem("fat-fire:compare");
    if (!compareList) {
      return [];
    }

    try {
      return JSON.parse(compareList) as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let active = true;
    fetchUsdRate(city.currency, city.fx.referenceRateUsdPerLocal).then((rate) => {
      if (active) {
        setFx(rate);
      }
    });
    return () => {
      active = false;
    };
  }, [city.currency, city.fx.referenceRateUsdPerLocal]);

  useEffect(() => {
    const encoded = encodeQueryState(inputs);
    const url = new URL(window.location.href);
    url.searchParams.set("q", encoded);
    window.history.replaceState(null, "", url.toString());
    window.localStorage.setItem(`fat-fire:${city.slug}`, encoded);
  }, [city.slug, inputs]);

  const compareSelection = Array.from(
    new Set([...compareCities, city.slug])
  ).slice(0, 4);
  const compareHref = `/compare?cities=${compareSelection.join(",")}`;
  const sourceTitle = city.sources.join(" · ");
  const baseTier = applyHouseholdProfile(
    city.tiers[inputs.tier],
    inputs.household,
    inputs.kidsCount
  );
  const displayedTier: TierCosts = {
    ...baseTier,
    ...inputs.categoryOverrides,
  };
  const housing = computeHousing(city.housing, {
    mode: inputs.housingMode,
    area: inputs.housingArea,
    size: inputs.housingSize,
    homeSqm: inputs.homeSqm,
  });
  const result = computeFireNumber(city, inputs, fx);
  const zeroBasis = computeFireNumber(
    city,
    {
      ...inputs,
      portfolio: {
        ...inputs.portfolio,
        costBasisPct: 0,
      },
    },
    fx
  );
  const fullBasis = computeFireNumber(
    city,
    {
      ...inputs,
      portfolio: {
        ...inputs.portfolio,
        costBasisPct: 1,
      },
    },
    fx
  );

  function updateInputs(next: CalcInputs) {
    setInputs(next);
  }

  function updateCategoryOverride(key: EditableCategoryKey, value: number) {
    const baseline = baseTier[key] as number;
    const overrides = { ...inputs.categoryOverrides };
    if (value === baseline) {
      delete overrides[key];
    } else {
      overrides[key] = value as never;
    }
    updateInputs({ ...inputs, categoryOverrides: overrides });
  }

  function addToComparison() {
    const next = compareSelection;
    setCompareCities(next);
    window.localStorage.setItem("fat-fire:compare", JSON.stringify(next));
  }

  const stateOptions = Object.entries(stateTax.states).map(([code, entry]) => ({
    value: code,
    label: entry.name,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            City calculator
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">
            {city.name}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {city.country} · {city.currency} · Updated {city.lastUpdated}
          </p>
          {city.lifestyle ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
              {city.lifestyle}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addToComparison}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-black/20"
          >
            Add to comparison
          </button>
          <Link
            href={compareHref}
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Open comparison
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)_minmax(19rem,23rem)]">
        <div className="min-w-0 space-y-4">
          <InputSection
            title="Household"
            description="Retirement horizon and family profile change spending pressure and warning thresholds."
          >
            <Select
              label="Profile"
              value={inputs.household}
              options={householdOptions}
              onChange={(value) => updateInputs({ ...inputs, household: value })}
            />
            {inputs.household === "family" ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Number of kids
                </span>
                <input
                  aria-label="Number of kids"
                  type="number"
                  min={1}
                  max={6}
                  value={inputs.kidsCount || 2}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      kidsCount: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Retirement age
                </span>
                <input
                  aria-label="Retirement age"
                  type="number"
                  min={30}
                  max={80}
                  value={inputs.retirementAge}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      retirementAge: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Life expectancy
                </span>
                <input
                  aria-label="Life expectancy"
                  type="number"
                  min={60}
                  max={110}
                  value={inputs.lifeExpectancy}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      lifeExpectancy: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>
          </InputSection>

          <InputSection title="Lifestyle tier">
            <Select
              label="Tier"
              value={inputs.tier}
              options={tierOptions}
              onChange={(value) => updateInputs({ ...inputs, tier: value })}
            />
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              {city.tiers[inputs.tier].description}
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-neutral-500">
              {tierOptions.map((opt) => (
                <li key={opt.value} className="flex gap-2">
                  <span
                    className={
                      opt.value === inputs.tier
                        ? "font-semibold text-neutral-900"
                        : "text-neutral-500"
                    }
                  >
                    {opt.label}:
                  </span>
                  <span className="text-neutral-500">
                    {city.tiers[opt.value].description}
                  </span>
                </li>
              ))}
            </ul>
          </InputSection>

          <InputSection title="Housing">
            <Select
              label="Mode"
              value={inputs.housingMode}
              options={housingModeOptions}
              onChange={(value) => updateInputs({ ...inputs, housingMode: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Area"
                value={inputs.housingArea}
                options={housingAreaOptions}
                onChange={(value) => updateInputs({ ...inputs, housingArea: value })}
              />
              <Select
                label="Size"
                value={inputs.housingSize}
                options={housingSizeOptions}
                onChange={(value) => updateInputs({ ...inputs, housingSize: value })}
              />
            </div>
            {inputs.housingMode === "own" ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Home size (sqm)
                </span>
                <input
                  aria-label="Home size (sqm)"
                  type="number"
                  min={20}
                  max={500}
                  value={inputs.homeSqm}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      homeSqm: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            ) : null}
          </InputSection>

          <InputSection
            title="Expense overrides"
            description="Values are entered in the city's local currency. Leave a field at the baseline preset to avoid storing an override."
          >
            <div className="grid gap-3">
              {editableCategories.map((field) => {
                const rawValue =
                  inputs.categoryOverrides[field.key] ?? displayedTier[field.key];
                const isPercent = field.key === "contingency_pct";
                return (
                  <label key={field.key} className="block space-y-1.5">
                    <span className="text-sm font-medium text-neutral-700">
                      {field.label}
                    </span>
                    <input
                      aria-label={field.label}
                      type="number"
                      step={field.step}
                      min={0}
                      value={rawValue as number}
                      onChange={(event) =>
                        updateCategoryOverride(field.key, Number(event.target.value))
                      }
                      title={sourceTitle}
                      className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                    />
                    <p className="text-xs text-neutral-500" title={sourceTitle}>
                      Baseline:{" "}
                      {isPercent
                        ? `${(Number(baseTier[field.key]) * 100).toFixed(0)}%`
                        : formatCurrency(
                            Number(baseTier[field.key]),
                            city.currency,
                            city.locale,
                            city.currency === "JPY" ? 0 : 0
                          )}
                    </p>
                  </label>
                );
              })}
            </div>
          </InputSection>

          <InputSection title="Portfolio composition">
            <Select
              label="Withdrawal sequencing"
              value={inputs.withdrawalStrategy}
              options={withdrawalStrategyOptions}
              onChange={(value) =>
                updateInputs({ ...inputs, withdrawalStrategy: value })
              }
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                Taxable: {(inputs.portfolio.taxablePct * 100).toFixed(0)}%
              </span>
              <input
                aria-label="Taxable portfolio share"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={inputs.portfolio.taxablePct}
                onChange={(event) => {
                  const taxablePct = Number(event.target.value);
                  const remaining = 1 - taxablePct;
                  const totalOther =
                    inputs.portfolio.traditionalPct + inputs.portfolio.rothPct;
                  const traditionalRatio =
                    totalOther > 0
                      ? inputs.portfolio.traditionalPct / totalOther
                      : 2 / 3;
                  updateInputs({
                    ...inputs,
                    portfolio: {
                      ...inputs.portfolio,
                      taxablePct,
                      traditionalPct: remaining * traditionalRatio,
                      rothPct: remaining * (1 - traditionalRatio),
                    },
                  });
                }}
                className="w-full"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                Traditional: {(inputs.portfolio.traditionalPct * 100).toFixed(0)}%
              </span>
              <input
                aria-label="Traditional portfolio share"
                type="range"
                min={0}
                max={1 - inputs.portfolio.taxablePct}
                step={0.05}
                value={inputs.portfolio.traditionalPct}
                onChange={(event) => {
                  const traditionalPct = Number(event.target.value);
                  updateInputs({
                    ...inputs,
                    portfolio: {
                      ...inputs.portfolio,
                      traditionalPct,
                      rothPct: Math.max(0, 1 - inputs.portfolio.taxablePct - traditionalPct),
                    },
                  });
                }}
                className="w-full"
              />
            </label>
            <p className="text-xs text-neutral-500">
              Roth: {(inputs.portfolio.rothPct * 100).toFixed(0)}%
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                Cost basis of taxable: {(inputs.portfolio.costBasisPct * 100).toFixed(0)}%
              </span>
              <input
                aria-label="Cost basis of taxable"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={inputs.portfolio.costBasisPct}
                onChange={(event) =>
                  updateInputs({
                    ...inputs,
                    portfolio: {
                      ...inputs.portfolio,
                      costBasisPct: Number(event.target.value),
                    },
                  })
                }
                className="w-full"
              />
            </label>
          </InputSection>

          <InputSection title="Tax assumptions">
            <Select
              label="US retirement state"
              value={inputs.usStateCode}
              options={stateOptions}
              onChange={(value) => updateInputs({ ...inputs, usStateCode: value })}
            />
          </InputSection>

          <InputSection
            title="Returns and runway"
            description="Current portfolio and annual savings are optional. If both are set, the calculator estimates a simple real-return path to the target."
          >
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                Safe withdrawal rate: {(inputs.swr * 100).toFixed(2)}%
              </span>
              <input
                aria-label="Safe withdrawal rate"
                type="range"
                min={0.025}
                max={0.045}
                step={0.0025}
                value={inputs.swr}
                onChange={(event) =>
                  updateInputs({ ...inputs, swr: Number(event.target.value) })
                }
                className="w-full"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Real return
                </span>
                <input
                  aria-label="Real return"
                  type="number"
                  min={0}
                  max={0.15}
                  step={0.005}
                  value={inputs.realReturn ?? 0.05}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      realReturn: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Inflation
                </span>
                <input
                  aria-label="Inflation"
                  type="number"
                  min={0}
                  max={0.1}
                  step={0.005}
                  value={inputs.inflation ?? 0.025}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      inflation: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Current portfolio (USD)
                </span>
                <input
                  aria-label="Current portfolio (USD)"
                  type="number"
                  min={0}
                  step={10000}
                  value={inputs.currentPortfolioUsd ?? 0}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      currentPortfolioUsd: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Annual savings (USD)
                </span>
                <input
                  aria-label="Annual savings (USD)"
                  type="number"
                  min={0}
                  step={5000}
                  value={inputs.annualSavingsUsd ?? 0}
                  onChange={(event) =>
                    updateInputs({
                      ...inputs,
                      annualSavingsUsd: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>
          </InputSection>
        </div>

        <div className="space-y-4">
          <SpendChart
            baselineTier={baseTier}
            adjustedTier={displayedTier}
            fxUsdPerLocal={fx}
            baselineHousingLocal={housing.annualHousingLocal}
            adjustedHousingLocal={housing.annualHousingLocal}
            sourceTitle={sourceTitle}
          />
          <TaxBreakdownChart
            grossWithdrawalUsd={result.grossWithdrawalUsd}
            federalLtcg={result.taxBreakdown.federalLtcg}
            federalOrdinary={result.taxBreakdown.federalOrdinary}
            niit={result.taxBreakdown.niit}
            stateTax={result.taxBreakdown.stateTax}
            sourceTitle={sourceTitle}
          />
          <details className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
            <summary className="flex items-center justify-between text-sm font-semibold text-neutral-950">
              Why this number?
              <span className="text-neutral-500">Expand</span>
            </summary>
            <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
              <p>
                Annual spend is calculated from your current city preset, household profile, housing mode, and category overrides. That net spend is then grossed up for tax drag before dividing by your SWR.
              </p>
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt>Annual spend (USD)</dt>
                  <dd title={sourceTitle}>
                    $
                    {result.annualSpendUsd.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Gross withdrawal</dt>
                  <dd title={sourceTitle}>
                    $
                    {result.grossWithdrawalUsd.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Total tax</dt>
                  <dd title={sourceTitle}>
                    $
                    {result.taxBreakdown.totalTax.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>SWR</dt>
                  <dd title={sourceTitle}>{(inputs.swr * 100).toFixed(2)}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Required portfolio</dt>
                  <dd title={sourceTitle}>
                    $
                    {result.fireNumberUsd.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </dd>
                </div>
              </dl>
              <div className="rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-600">
                <p className="font-semibold text-neutral-800">Cost basis sensitivity</p>
                <p className="mt-2">
                  0% basis: $
                  {zeroBasis.fireNumberUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p>
                  Current basis: $
                  {result.fireNumberUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p>
                  100% basis: $
                  {fullBasis.fireNumberUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </details>
          <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
            <h3 className="text-sm font-semibold text-neutral-950">Data provenance</h3>
            <p className="mt-1 text-xs leading-6 text-neutral-600">
              {city.sources.join(" · ")}
            </p>
            <p className="mt-3 text-xs leading-6 text-neutral-500">
              Snapshot FX fallback from {city.fx.asOf}. Live FX uses a free reference feed when available.
            </p>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-[28px] border border-black/10 bg-white/90 p-6 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.52)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Fat FIRE target
            </p>
            <div
              data-testid="fire-target-value"
              className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950"
              title={sourceTitle}
            >
              $
              {result.fireNumberUsd.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </div>
            <p className="mt-2 text-sm text-neutral-500" title={sourceTitle}>
              {formatCurrency(result.fireNumberUsd / fx, city.currency, city.locale)}
            </p>
            {inputs.housingMode === "own" ? (
              <p
                data-testid="home-addback"
                className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
              >
                Home value add-back:{" "}
                <strong>
                  $
                  {result.homeValueUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </strong>
                . Total capital needed:{" "}
                <strong>
                  $
                  {result.totalCapitalNeededUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </strong>
                .
              </p>
            ) : null}
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Annual spend</dt>
                <dd title={sourceTitle}>
                  $
                  {result.annualSpendUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Gross withdrawal</dt>
                <dd title={sourceTitle}>
                  $
                  {result.grossWithdrawalUsd.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Total tax</dt>
                <dd title={sourceTitle}>
                  $
                  {result.taxBreakdown.totalTax.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Net spend</dt>
                <dd title={sourceTitle}>
                  $
                  {(result.grossWithdrawalUsd - result.taxBreakdown.totalTax).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Years to FIRE</dt>
                <dd data-testid="years-to-fire" title={sourceTitle}>
                  {result.yearsToFire ? `${result.yearsToFire} years` : "Add portfolio + savings"}
                </dd>
              </div>
            </dl>
            {result.warnings.length > 0 ? (
              <div className="mt-5 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                {result.warnings.map((warning, index) => (
                  <p key={index}>{warning}</p>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
