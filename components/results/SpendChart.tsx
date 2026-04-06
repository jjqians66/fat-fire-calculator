"use client";

import { useMeasuredDimensions } from "@/components/results/useMeasuredDimensions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TierCosts } from "@/lib/calc/types";

interface SpendChartProps {
  baselineTier: TierCosts;
  adjustedTier: TierCosts;
  fxUsdPerLocal: number;
  baselineHousingLocal: number;
  adjustedHousingLocal: number;
  sourceTitle?: string;
}

const ROW_HEIGHT = 32;
const CHART_PADDING = 120;

function formatUsd(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${Math.round(value)}`;
}

export function SpendChart({
  baselineTier,
  adjustedTier,
  fxUsdPerLocal,
  baselineHousingLocal,
  adjustedHousingLocal,
  sourceTitle,
}: SpendChartProps) {
  const { t, locale } = useLocale();
  const displayLocale = locale === "zh" ? "zh-CN" : "en-US";
  const { ref, width } = useMeasuredDimensions();
  const toMonthlyUsd = (localPerMonth: number) => localPerMonth * fxUsdPerLocal;
  const annualToMonthlyUsd = (localPerYear: number) => (localPerYear / 12) * fxUsdPerLocal;
  const rawData = [
    {
      name: t.calc.categoryLabels.housing,
      baseline: (baselineHousingLocal / 12) * fxUsdPerLocal,
      adjusted: (adjustedHousingLocal / 12) * fxUsdPerLocal,
    },
    {
      name: t.calc.categoryLabels.groceries,
      baseline: toMonthlyUsd(baselineTier.groceries_monthly),
      adjusted: toMonthlyUsd(adjustedTier.groceries_monthly),
    },
    {
      name: t.calc.categoryLabels.dining_out,
      baseline: toMonthlyUsd(baselineTier.dining_out_monthly),
      adjusted: toMonthlyUsd(adjustedTier.dining_out_monthly),
    },
    {
      name: t.calc.categoryLabels.transport,
      baseline: toMonthlyUsd(baselineTier.transport_monthly),
      adjusted: toMonthlyUsd(adjustedTier.transport_monthly),
    },
    {
      name: t.calc.categoryLabels.healthcare,
      baseline: toMonthlyUsd(baselineTier.healthcare_monthly),
      adjusted: toMonthlyUsd(adjustedTier.healthcare_monthly),
    },
    {
      name: t.calc.categoryLabels.utilities,
      baseline: toMonthlyUsd(baselineTier.utilities_monthly),
      adjusted: toMonthlyUsd(adjustedTier.utilities_monthly),
    },
    {
      name: t.calc.categoryLabels.internet_mobile,
      baseline: toMonthlyUsd(baselineTier.internet_mobile_monthly),
      adjusted: toMonthlyUsd(adjustedTier.internet_mobile_monthly),
    },
    {
      name: t.calc.categoryLabels.entertainment,
      baseline: toMonthlyUsd(baselineTier.entertainment_monthly),
      adjusted: toMonthlyUsd(adjustedTier.entertainment_monthly),
    },
    {
      name: t.calc.categoryLabels.personal_services,
      baseline: toMonthlyUsd(baselineTier.personal_services_monthly),
      adjusted: toMonthlyUsd(adjustedTier.personal_services_monthly),
    },
    {
      name: t.calc.categoryLabels.domestic_help,
      baseline: toMonthlyUsd(baselineTier.domestic_help_monthly),
      adjusted: toMonthlyUsd(adjustedTier.domestic_help_monthly),
    },
    {
      name: t.calc.categoryLabels.luxury_misc,
      baseline: toMonthlyUsd(baselineTier.luxury_misc_monthly),
      adjusted: toMonthlyUsd(adjustedTier.luxury_misc_monthly),
    },
    {
      name: t.calc.categoryLabels.education,
      baseline: annualToMonthlyUsd(baselineTier.education_annual),
      adjusted: annualToMonthlyUsd(adjustedTier.education_annual),
    },
    {
      name: t.calc.categoryLabels.travel,
      baseline: annualToMonthlyUsd(baselineTier.travel_annual),
      adjusted: annualToMonthlyUsd(adjustedTier.travel_annual),
    },
    {
      name: t.calc.categoryLabels.legal_tax,
      baseline: annualToMonthlyUsd(baselineTier.legal_tax_compliance_annual),
      adjusted: annualToMonthlyUsd(adjustedTier.legal_tax_compliance_annual),
    },
    {
      name: t.calc.categoryLabels.visa_residency,
      baseline: annualToMonthlyUsd(baselineTier.visa_residency_annual),
      adjusted: annualToMonthlyUsd(adjustedTier.visa_residency_annual),
    },
  ].filter((entry) => entry.baseline > 0 || entry.adjusted > 0);

  const data = [...rawData].sort(
    (a, b) => Math.max(b.baseline, b.adjusted) - Math.max(a.baseline, a.adjusted)
  );

  const chartHeight = data.length * ROW_HEIGHT + CHART_PADDING;

  return (
    <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
      <h3 className="text-sm font-semibold text-neutral-950">
        {t.calc.spendChartTitle}
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        {t.calc.spendChartSub}
      </p>
      <div
        ref={ref}
        className="mt-4 min-w-0"
        style={{ height: chartHeight }}
        title={sourceTitle}
      >
        {width > 16 ? (
          <BarChart
            width={Math.max(width, 320)}
            height={chartHeight}
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
            barCategoryGap={6}
            barGap={2}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="rgba(17,24,39,0.08)"
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
              formatter={(value) =>
                value === "adjusted" ? t.calc.yourOverrides : t.calc.cityBaseline
              }
            />
            <XAxis
              type="number"
              tickCount={6}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatUsd}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 12, fill: "#334155" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,118,110,0.06)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
              formatter={(value, name) => [
                `$${Number(value ?? 0).toLocaleString(displayLocale, {
                  maximumFractionDigits: 0,
                })}`,
                name === "baseline" ? t.calc.cityBaseline : t.calc.yourOverrides,
              ]}
            />
            <Bar dataKey="baseline" fill="#cbd5e1" barSize={10} />
            <Bar dataKey="adjusted" fill="#0f766e" barSize={10} />
          </BarChart>
        ) : (
          <div className="h-full rounded-2xl bg-neutral-100" />
        )}
      </div>
    </div>
  );
}
