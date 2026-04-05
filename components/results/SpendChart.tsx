"use client";

import { useMeasuredDimensions } from "@/components/results/useMeasuredDimensions";
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
  const { ref, width } = useMeasuredDimensions();
  const rawData = [
    {
      name: "Housing",
      baseline: baselineHousingLocal * fxUsdPerLocal,
      adjusted: adjustedHousingLocal * fxUsdPerLocal,
    },
    {
      name: "Groceries",
      baseline: baselineTier.groceries_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.groceries_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Dining out",
      baseline: baselineTier.dining_out_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.dining_out_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Transport",
      baseline: baselineTier.transport_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.transport_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Healthcare",
      baseline: baselineTier.healthcare_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.healthcare_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Utilities",
      baseline: baselineTier.utilities_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.utilities_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Internet / mobile",
      baseline: baselineTier.internet_mobile_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.internet_mobile_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Entertainment",
      baseline: baselineTier.entertainment_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.entertainment_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Personal services",
      baseline: baselineTier.personal_services_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.personal_services_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Domestic help",
      baseline: baselineTier.domestic_help_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.domestic_help_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Luxury misc",
      baseline: baselineTier.luxury_misc_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.luxury_misc_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Education",
      baseline: baselineTier.education_annual * fxUsdPerLocal,
      adjusted: adjustedTier.education_annual * fxUsdPerLocal,
    },
    {
      name: "Travel",
      baseline: baselineTier.travel_annual * fxUsdPerLocal,
      adjusted: adjustedTier.travel_annual * fxUsdPerLocal,
    },
    {
      name: "Legal / tax",
      baseline: baselineTier.legal_tax_compliance_annual * fxUsdPerLocal,
      adjusted: adjustedTier.legal_tax_compliance_annual * fxUsdPerLocal,
    },
    {
      name: "Visa / residency",
      baseline: baselineTier.visa_residency_annual * fxUsdPerLocal,
      adjusted: adjustedTier.visa_residency_annual * fxUsdPerLocal,
    },
  ].filter((entry) => entry.baseline > 0 || entry.adjusted > 0);

  const data = [...rawData].sort(
    (a, b) => Math.max(b.baseline, b.adjusted) - Math.max(a.baseline, a.adjusted)
  );

  const chartHeight = data.length * ROW_HEIGHT + CHART_PADDING;

  return (
    <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
      <h3 className="text-sm font-semibold text-neutral-950">
        Annual spend by category
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        Baseline preset vs your current overrides, sorted by size, in USD.
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
                value === "adjusted" ? "Your overrides" : "City baseline"
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
                `$${Number(value ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`,
                name === "baseline" ? "City baseline" : "Your overrides",
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
