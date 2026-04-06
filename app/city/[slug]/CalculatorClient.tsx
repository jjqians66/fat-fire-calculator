"use client";

import assumptions from "@/data/assumptions.json";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { InputSection } from "@/components/inputs/InputSection";
import { Select } from "@/components/inputs/Select";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  getLocalizedCityLifestyle,
  getLocalizedTierNarrative,
} from "@/lib/i18n/cityCopy";
import { computeHousing } from "@/lib/calc/housing";
import { applyHouseholdProfile } from "@/lib/calc/household";
import { computeFireNumber } from "@/lib/calc/fireNumber";
import { runMonteCarlo } from "@/lib/calc/monteCarlo";
import { DEFAULT_INPUTS } from "@/lib/calc/defaults";
import { fetchUsdRate } from "@/lib/fx/fetchRates";
import { stateTax } from "@/lib/calc/taxData";
import type {
  CalcInputs,
  CalcWarning,
  CityData,
  TierCosts,
} from "@/lib/calc/types";

const SpendChart = dynamic(
  () =>
    import("@/components/results/SpendChart").then((module) => module.SpendChart),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
        <div className="h-4 w-36 animate-pulse rounded-full bg-neutral-200" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded-full bg-neutral-100" />
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
        <div className="h-4 w-36 animate-pulse rounded-full bg-neutral-200" />
        <div className="mt-2 h-3 w-52 animate-pulse rounded-full bg-neutral-100" />
        <div className="mt-4 h-[220px] animate-pulse rounded-[20px] bg-neutral-100" />
      </div>
    ),
  }
);

const MonteCarloChart = dynamic(
  () =>
    import("@/components/results/MonteCarloChart").then(
      (module) => module.MonteCarloChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 h-[220px] animate-pulse rounded-[20px] bg-neutral-100" />
    ),
  }
);

const tierKeys = ["comfortable_expat", "true_fat_fire", "luxury_family"] as const;
const householdKeys = ["single", "couple", "family"] as const;
const housingModeKeys = ["rent", "own"] as const;
const housingAreaKeys = ["central", "suburb"] as const;
const housingSizeKeys = ["1br", "3br"] as const;
const withdrawalKeys = ["proportional", "tax_optimal"] as const;
const filingStatusKeys = ["single", "married_filing_jointly"] as const;

type EditableCategoryKey = Exclude<keyof TierCosts, "description" | "guide">;

const editableCategories: Array<{
  key: EditableCategoryKey;
  step: number;
}> = [
  { key: "groceries_monthly", step: 100 },
  { key: "dining_out_monthly", step: 100 },
  { key: "transport_monthly", step: 100 },
  { key: "healthcare_monthly", step: 100 },
  { key: "utilities_monthly", step: 50 },
  { key: "internet_mobile_monthly", step: 50 },
  { key: "entertainment_monthly", step: 100 },
  { key: "personal_services_monthly", step: 100 },
  { key: "domestic_help_monthly", step: 100 },
  { key: "luxury_misc_monthly", step: 100 },
  { key: "education_annual", step: 1000 },
  { key: "travel_annual", step: 1000 },
  { key: "legal_tax_compliance_annual", step: 500 },
  { key: "visa_residency_annual", step: 500 },
  { key: "contingency_pct", step: 0.01 },
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

function formatSignedAmount(amount: number, currency: string, locale: string) {
  const formatted = formatCurrency(Math.abs(amount), currency, locale);
  return `${amount >= 0 ? "+" : "-"}${formatted}`;
}

function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function CalculatorClient({
  city,
  initialQueryState,
}: {
  city: CityData;
  initialQueryState: string | null;
}) {
  const { t, locale } = useLocale();
  const displayLocale = locale === "zh" ? "zh-CN" : "en-US";
  const tierOptions = tierKeys.map((value) => ({ value, label: t.tiers[value] }));
  const householdOptions = householdKeys.map((value) => ({ value, label: t.households[value] }));
  const housingModeOptions = housingModeKeys.map((value) => ({ value, label: t.housingMode[value] }));
  const housingAreaOptions = housingAreaKeys.map((value) => ({ value, label: t.housingArea[value] }));
  const housingSizeOptions = housingSizeKeys.map((value) => ({ value, label: t.housingSize[value] }));
  const withdrawalStrategyOptions = withdrawalKeys.map((value) => ({ value, label: t.withdrawal[value] }));
  const filingStatusOptions = filingStatusKeys.map((value) => ({
    value,
    label: t.filingStatus[value],
  }));
  const [inputs, setInputs] = useState<CalcInputs>(() => {
    const parsedQuery = decodeQueryState(initialQueryState);
    return mergeInputs(DEFAULT_INPUTS, parsedQuery ?? {});
  });
  const [fx, setFx] = useState(city.fx.referenceRateUsdPerLocal);
  const [compareCities, setCompareCities] = useState<string[]>([]);
  const [hasRestoredInputs, setHasRestoredInputs] = useState(
    () => initialQueryState !== null
  );

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
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const compareList = window.localStorage.getItem("fat-fire:compare");
      if (compareList) {
        try {
          setCompareCities(JSON.parse(compareList) as string[]);
        } catch {
          setCompareCities([]);
        }
      } else {
        setCompareCities([]);
      }

      if (initialQueryState !== null) {
        setHasRestoredInputs(true);
        return;
      }

      const localState = decodeQueryState(
        window.localStorage.getItem(`fat-fire:${city.slug}`)
      );
      if (localState) {
        setInputs(mergeInputs(DEFAULT_INPUTS, localState));
      }
      setHasRestoredInputs(true);
    });

    return () => {
      cancelled = true;
    };
  }, [city.slug, initialQueryState]);

  useEffect(() => {
    if (!hasRestoredInputs) {
      return;
    }

    const encoded = encodeQueryState(inputs);
    const url = new URL(window.location.href);
    url.searchParams.set("q", encoded);
    window.history.replaceState(null, "", url.toString());
    window.localStorage.setItem(`fat-fire:${city.slug}`, encoded);
  }, [city.slug, hasRestoredInputs, inputs]);

  const compareSelection = Array.from(
    new Set([...compareCities, city.slug])
  ).slice(0, 4);
  const compareHref = `/compare?cities=${compareSelection.join(",")}`;
  const sourceTitle = city.sources.join(" · ");
  const cityContext = getLocalizedCityLifestyle(city, locale);
  const selectedTier = city.tiers[inputs.tier];
  const selectedTierNarrative = getLocalizedTierNarrative(city, inputs.tier, locale);
  const stockAllocationPct =
    inputs.stockAllocationPct ?? assumptions.defaultStockAllocationPct;
  const bondAllocationPct = 1 - stockAllocationPct;
  const baseTier = applyHouseholdProfile(
    selectedTier,
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
  const deferredAnnualSpendUsd = useDeferredValue(result.annualSpendUsd);
  const deferredCurrentPortfolioUsd = useDeferredValue(inputs.currentPortfolioUsd ?? 0);
  const deferredRetirementAge = useDeferredValue(inputs.retirementAge);
  const deferredLifeExpectancy = useDeferredValue(inputs.lifeExpectancy);
  const deferredStockAllocationPct = useDeferredValue(stockAllocationPct);
  const deferredRealReturn = useDeferredValue(
    inputs.realReturn ?? assumptions.defaultRealReturn
  );
  const monteCarloResult = useMemo(() => {
    if (deferredCurrentPortfolioUsd <= 0) {
      return null;
    }

    return runMonteCarlo({
      annualSpendUsd: deferredAnnualSpendUsd,
      currentPortfolioUsd: deferredCurrentPortfolioUsd,
      retirementAge: deferredRetirementAge,
      lifeExpectancy: deferredLifeExpectancy,
      stockAllocationPct: deferredStockAllocationPct,
      expectedRealReturn: deferredRealReturn,
    });
  }, [
    deferredAnnualSpendUsd,
    deferredCurrentPortfolioUsd,
    deferredLifeExpectancy,
    deferredRealReturn,
    deferredRetirementAge,
    deferredStockAllocationPct,
  ]);
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
      overrides[key] = value;
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
  const housingMonthlyLocal = housing.annualHousingLocal / 12;
  const currentHousingSummary =
    locale === "zh"
      ? inputs.housingMode === "rent"
        ? `${t.housingArea[inputs.housingArea]}${t.housingSize[inputs.housingSize]}${t.housingMode[inputs.housingMode]}，月租约 ${formatCurrency(
            housingMonthlyLocal,
            city.currency,
            city.locale
          )}。`
        : `${t.housingArea[inputs.housingArea]}自有住房，面积约 ${inputs.homeSqm} 平方米，估值约 ${formatCurrency(
            housing.homeValueLocal,
            city.currency,
            city.locale
          )}，${t.calc.monthlyCarryCost}约 ${formatCurrency(
            housingMonthlyLocal,
            city.currency,
            city.locale
          )}。`
      : inputs.housingMode === "rent"
        ? `${t.housingArea[inputs.housingArea]} ${t.housingSize[inputs.housingSize]} ${t.housingMode[inputs.housingMode].toLowerCase()} at about ${formatCurrency(
            housingMonthlyLocal,
            city.currency,
            city.locale
          )} per month.`
        : `${inputs.homeSqm} sqm ${t.housingArea[inputs.housingArea].toLowerCase()} home valued around ${formatCurrency(
            housing.homeValueLocal,
            city.currency,
            city.locale
          )}, with carrying costs near ${formatCurrency(
            housingMonthlyLocal,
            city.currency,
            city.locale
          )} per month.`;
  const rhythmSummary =
    locale === "zh"
      ? `${t.calc.categoryLabels.transport}约 ${formatCurrency(
          displayedTier.transport_monthly,
          city.currency,
          city.locale
        )}/月，${t.calc.categoryLabels.personal_services}约 ${formatCurrency(
          displayedTier.personal_services_monthly,
          city.currency,
          city.locale
        )}/月，${t.calc.categoryLabels.domestic_help}约 ${formatCurrency(
          displayedTier.domestic_help_monthly,
          city.currency,
          city.locale
        )}/月，${t.calc.categoryLabels.entertainment}约 ${formatCurrency(
          displayedTier.entertainment_monthly,
          city.currency,
          city.locale
        )}/月。`
      : `${t.calc.categoryLabels.transport} ${formatCurrency(
          displayedTier.transport_monthly,
          city.currency,
          city.locale
        )} / mo, ${t.calc.categoryLabels.personal_services.toLowerCase()} ${formatCurrency(
          displayedTier.personal_services_monthly,
          city.currency,
          city.locale
        )} / mo, ${t.calc.categoryLabels.domestic_help.toLowerCase()} ${formatCurrency(
          displayedTier.domestic_help_monthly,
          city.currency,
          city.locale
        )} / mo, ${t.calc.categoryLabels.entertainment.toLowerCase()} ${formatCurrency(
          displayedTier.entertainment_monthly,
          city.currency,
          city.locale
        )} / mo.`;
  const perMonthLabel = locale === "zh" ? "/月" : "/ month";
  const formatUsdNumber = (value: number) =>
    value.toLocaleString(displayLocale, { maximumFractionDigits: 0 });
  const formatUsdValue = (value: number) => `$${formatUsdNumber(value)}`;
  const fxFallbackText = t.calc.fxFallback.replace("{date}", city.fx.asOf);
  const formatWarning = (warning: CalcWarning) => {
    switch (warning.key) {
      case "aggressive_swr":
        return t.calc.warnings.aggressiveSwr
          .replace("{swr}", warning.swrPct.toFixed(1))
          .replace("{horizon}", String(warning.horizonYears));
      case "high_cost_basis":
        return t.calc.warnings.highCostBasis;
      case "domicile_required":
        return t.calc.warnings.domicileRequired.replace(
          "{state}",
          warning.stateCode
        );
      case "solver_not_converged":
        return t.calc.warnings.solverNotConverged
          .replace("{iterations}", String(warning.iterations))
          .replace(
            "{residual}",
            Math.round(warning.residualUsd).toLocaleString(displayLocale)
          );
      case "local_taxes_omitted":
        return t.calc.warnings.localTaxesOmitted;
      default:
        return "";
    }
  };
  const overrideSummaries = editableCategories
    .flatMap((field) => {
      const override = inputs.categoryOverrides[field.key];
      if (override === undefined) {
        return [];
      }

      const baseline = Number(baseTier[field.key]);
      const current = Number(override);
      const delta = current - baseline;
      if (delta === 0) {
        return [];
      }

      const valueLabel =
        field.key === "contingency_pct"
          ? `${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)}${
              locale === "zh" ? " 个百分点" : " pts"
            }`
          : formatSignedAmount(delta, city.currency, city.locale);

      return [
        {
          key: field.key,
          label: t.calc.expenseFields[field.key],
          valueLabel,
        },
      ];
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            {t.calc.kicker}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">
            {city.name}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {city.country} · {city.currency} · {t.calc.updated} {city.lastUpdated}
          </p>
          {cityContext ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
              {cityContext}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addToComparison}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-black/20"
          >
            {t.calc.addToCompare}
          </button>
          <Link
            href={compareHref}
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {t.calc.openCompare}
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)_minmax(19rem,23rem)]">
        <div className="min-w-0 space-y-4">
          <InputSection
            title={t.calc.household}
            description={t.calc.householdDesc}
          >
            <Select
              label={t.calc.profile}
              value={inputs.household}
              options={householdOptions}
              onChange={(value) =>
                updateInputs({
                  ...inputs,
                  household: value,
                  filingStatus:
                    value === "single" ? "single" : inputs.filingStatus,
                })
              }
            />
            {inputs.household === "family" ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  {t.calc.numKids}
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
                  {t.calc.retirementAge}
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
                  {t.calc.lifeExpectancy}
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

          <InputSection title={t.calc.lifestyleTier}>
            <p className="mb-3 text-xs text-neutral-500">{t.calc.tierHelp}</p>
            <div className="space-y-2">
              {tierOptions.map((opt) => {
                const selected = opt.value === inputs.tier;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`tier-option-${opt.value}`}
                    aria-pressed={selected}
                    onClick={() =>
                      updateInputs({ ...inputs, tier: opt.value })
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm"
                        : "border-black/10 bg-white hover:border-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          selected ? "text-[var(--accent)]" : "text-neutral-900"
                        }`}
                      >
                        {opt.label}
                      </span>
                      {selected ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                          {t.calc.selected}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
                      {getLocalizedTierNarrative(city, opt.value, locale).description}
                    </p>
                  </button>
                );
              })}
            </div>
          </InputSection>

          <InputSection title={t.calc.housing}>
            <Select
              label={t.calc.mode}
              value={inputs.housingMode}
              options={housingModeOptions}
              onChange={(value) => updateInputs({ ...inputs, housingMode: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label={t.calc.area}
                value={inputs.housingArea}
                options={housingAreaOptions}
                onChange={(value) => updateInputs({ ...inputs, housingArea: value })}
              />
              <Select
                label={t.calc.size}
                value={inputs.housingSize}
                options={housingSizeOptions}
                onChange={(value) => updateInputs({ ...inputs, housingSize: value })}
              />
            </div>
            {inputs.housingMode === "own" ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  {t.calc.homeSqm}
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
            title={t.calc.expenseOverrides}
            description={t.calc.expenseOverridesDesc}
          >
            <div className="grid gap-3">
              {editableCategories.map((field) => {
                const rawValue =
                  inputs.categoryOverrides[field.key] ?? displayedTier[field.key];
                const isPercent = field.key === "contingency_pct";
                const fieldLabel = t.calc.expenseFields[field.key];
                return (
                  <label key={field.key} className="block space-y-1.5">
                    <span className="text-sm font-medium text-neutral-700">
                      {fieldLabel}
                    </span>
                    <input
                      aria-label={fieldLabel}
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
                      {t.calc.baseline}:{" "}
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

          <InputSection title={t.calc.portfolio}>
            <Select
              label={t.calc.withdrawalSeq}
              value={inputs.withdrawalStrategy}
              options={withdrawalStrategyOptions}
              onChange={(value) =>
                updateInputs({ ...inputs, withdrawalStrategy: value })
              }
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                {t.calc.taxable}: {(inputs.portfolio.taxablePct * 100).toFixed(0)}%
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
                {t.calc.traditional}: {(inputs.portfolio.traditionalPct * 100).toFixed(0)}%
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
              {t.calc.roth}: {(inputs.portfolio.rothPct * 100).toFixed(0)}%
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                {t.calc.costBasis}: {(inputs.portfolio.costBasisPct * 100).toFixed(0)}%
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

          <InputSection title={t.calc.taxAssumptions}>
            <Select
              label={t.calc.filingStatus}
              value={inputs.filingStatus}
              options={filingStatusOptions}
              onChange={(value) => updateInputs({ ...inputs, filingStatus: value })}
            />
            <Select
              label={t.calc.usState}
              value={inputs.usStateCode}
              options={stateOptions}
              onChange={(value) => updateInputs({ ...inputs, usStateCode: value })}
            />
          </InputSection>

          <InputSection
            title={t.calc.returnsRunway}
            description={t.calc.returnsRunwayDesc}
          >
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                {t.calc.swr}: {(inputs.swr * 100).toFixed(2)}%
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
                  {t.calc.realReturn}
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
                  {t.calc.inflation}
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
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                {t.calc.stockAllocation}: {formatPercent(stockAllocationPct, 0)} ·{" "}
                {t.calc.bondAllocation}: {formatPercent(bondAllocationPct, 0)}
              </span>
              <input
                aria-label={t.calc.stockAllocation}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={stockAllocationPct}
                onChange={(event) =>
                  updateInputs({
                    ...inputs,
                    stockAllocationPct: Number(event.target.value),
                  })
                }
                className="w-full"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  {t.calc.currentPortfolio}
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
                  {t.calc.annualSavings}
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
              {t.calc.whyThisNumber}
              <span className="text-neutral-500">{t.calc.expand}</span>
            </summary>
            <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
              <p>{t.calc.explanationIntro}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {t.calc.cityContext}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {cityContext}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {t.calc.homeBase}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {selectedTierNarrative.description}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700" title={sourceTitle}>
                    <span className="font-medium text-neutral-800">
                      {t.calc.currentHousing}:{" "}
                    </span>
                    {currentHousingSummary}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {t.calc.groceriesGuide}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {selectedTierNarrative.guide.groceries}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500" title={sourceTitle}>
                    {t.calc.groceryBudget}:{" "}
                    {formatCurrency(
                      displayedTier.groceries_monthly,
                      city.currency,
                      city.locale
                    )}{" "}
                    {perMonthLabel}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {t.calc.diningGuide}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {selectedTierNarrative.guide.dining}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500" title={sourceTitle}>
                    {t.calc.diningBudget}:{" "}
                    {formatCurrency(
                      displayedTier.dining_out_monthly,
                      city.currency,
                      city.locale
                    )}{" "}
                    {perMonthLabel}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {t.calc.rhythmGuide}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {selectedTierNarrative.guide.rhythm}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500" title={sourceTitle}>
                    {rhythmSummary}
                  </p>
                </div>
              </div>
              {overrideSummaries.length > 0 ? (
                <div className="rounded-2xl border border-black/8 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {t.calc.overridesTitle}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-neutral-700">
                    {overrideSummaries.map((entry) => (
                      <li key={entry.key}>
                        {entry.label}: {entry.valueLabel}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {t.calc.calculationChain}
              </p>
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt>{t.calc.annualSpendUsd}</dt>
                  <dd title={sourceTitle}>{formatUsdValue(result.annualSpendUsd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t.calc.grossWithdrawal}</dt>
                  <dd title={sourceTitle}>{formatUsdValue(result.grossWithdrawalUsd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t.calc.totalTax}</dt>
                  <dd title={sourceTitle}>{formatUsdValue(result.taxBreakdown.totalTax)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>SWR</dt>
                  <dd title={sourceTitle}>{(inputs.swr * 100).toFixed(2)}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t.calc.requiredPortfolio}</dt>
                  <dd title={sourceTitle}>{formatUsdValue(result.fireNumberUsd)}</dd>
                </div>
              </dl>
              <div className="rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-600">
                <p className="font-semibold text-neutral-800">{t.calc.costBasisSensitivity}</p>
                <p className="mt-2">
                  {t.calc.zeroBasis}: {formatUsdValue(zeroBasis.fireNumberUsd)}
                </p>
                <p>
                  {t.calc.currentBasis}: {formatUsdValue(result.fireNumberUsd)}
                </p>
                <p>
                  {t.calc.fullBasis}: {formatUsdValue(fullBasis.fireNumberUsd)}
                </p>
              </div>
            </div>
          </details>
          <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
            <h3 className="text-sm font-semibold text-neutral-950">{t.calc.dataProvenance}</h3>
            <p className="mt-1 text-xs leading-6 text-neutral-600">
              {city.sources.join(" · ")}
            </p>
            <p className="mt-3 text-xs leading-6 text-neutral-500">
              {fxFallbackText}
            </p>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-[28px] border border-black/10 bg-white/90 p-6 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.52)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              {t.calc.fireTarget}
            </p>
            <div
              data-testid="fire-target-value"
              className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950"
              title={sourceTitle}
            >
              {formatUsdValue(result.fireNumberUsd)}
            </div>
            <p className="mt-2 text-sm text-neutral-500" title={sourceTitle}>
              {formatCurrency(result.fireNumberUsd / fx, city.currency, city.locale)}
            </p>
            {inputs.housingMode === "own" ? (
              <p
                data-testid="home-addback"
                className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
              >
                {t.calc.homeValueAddBack}: <strong>{formatUsdValue(result.homeValueUsd)}</strong>
                {locale === "zh" ? "。 " : ". "}
                {t.calc.totalCapitalNeeded}:{" "}
                <strong>{formatUsdValue(result.totalCapitalNeededUsd)}</strong>
                {locale === "zh" ? "。" : "."}
              </p>
            ) : null}
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">{t.calc.monthlySpend}</dt>
                <dd title={sourceTitle}>{formatUsdValue(result.annualSpendUsd / 12)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">{t.calc.grossWithdrawalMo}</dt>
                <dd title={sourceTitle}>{formatUsdValue(result.grossWithdrawalUsd / 12)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">{t.calc.taxMo}</dt>
                <dd title={sourceTitle}>{formatUsdValue(result.taxBreakdown.totalTax / 12)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">{t.calc.netSpendMo}</dt>
                <dd title={sourceTitle}>
                  {formatUsdValue(
                    (result.grossWithdrawalUsd - result.taxBreakdown.totalTax) / 12
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">{t.calc.yearsToFire}</dt>
                <dd data-testid="years-to-fire" title={sourceTitle}>
                  {result.yearsToFire
                    ? `${result.yearsToFire} ${t.calc.yearsSuffix}`
                    : t.calc.addPortfolioSavings}
                </dd>
              </div>
            </dl>
            {result.warnings.length > 0 ? (
              <div className="mt-5 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                {result.warnings.map((warning, index) => (
                  <p key={index}>{formatWarning(warning)}</p>
                ))}
              </div>
            ) : null}
          </div>
          <details className="rounded-[28px] border border-black/10 bg-white/90 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.32)]">
            <summary className="flex items-center justify-between text-sm font-semibold text-neutral-950">
              {t.calc.stressTest}
              <span className="text-neutral-500">{t.calc.stressTestExpand}</span>
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-neutral-700">
                {t.calc.stressTestDesc}
              </p>
              {monteCarloResult ? (
                <>
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {t.calc.portfolioLastsToAge.replace(
                        "{age}",
                        String(inputs.lifeExpectancy)
                      )}
                    </p>
                    <p
                      data-testid="stress-test-success-rate"
                      className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950"
                    >
                      {formatPercent(monteCarloResult.successRate)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      {t.calc.deterministicBaseline}: {formatUsdValue(result.fireNumberUsd)}
                      {" · "}
                      {t.calc.simulatedStressTest}:{" "}
                      {formatUsdValue(inputs.currentPortfolioUsd ?? 0)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-xs text-neutral-500">{t.calc.successProbability}</p>
                      <p className="mt-1 font-semibold text-neutral-900">
                        {formatPercent(monteCarloResult.successRate)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-xs text-neutral-500">{t.calc.simulationTrials}</p>
                      <p className="mt-1 font-semibold text-neutral-900">
                        {monteCarloResult.trials.toLocaleString(displayLocale)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-xs text-neutral-500">{t.calc.percentilePath}</p>
                      <p className="mt-1 font-semibold text-neutral-900">
                        {formatUsdValue(
                          monteCarloResult.percentile10EndingPortfolioUsd
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-black/8 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500">
                      <span>
                        {t.calc.stockAllocation}: {formatPercent(stockAllocationPct, 0)}
                      </span>
                      <span>
                        {t.calc.bondAllocation}: {formatPercent(bondAllocationPct, 0)}
                      </span>
                      <span>
                        {t.calc.realReturn}: {formatPercent(
                          inputs.realReturn ?? assumptions.defaultRealReturn,
                          1
                        )}
                      </span>
                      <span>
                        {t.calc.inflation}: {formatPercent(inputs.inflation ?? 0.025, 1)}
                      </span>
                      <span>
                        {locale === "zh" ? "年波动率" : "Annual volatility"}:{" "}
                        {formatPercent(monteCarloResult.annualVolatility, 1)}
                      </span>
                    </div>
                    <MonteCarloChart data={monteCarloResult.percentile10Trajectory} />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
                  {t.calc.addPortfolioForStressTest}
                </div>
              )}
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
