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

export function SpendChart({
  baselineTier,
  adjustedTier,
  fxUsdPerLocal,
  baselineHousingLocal,
  adjustedHousingLocal,
  sourceTitle,
}: SpendChartProps) {
  const { ref, width, height } = useMeasuredDimensions();
  const data = [
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
      name: "Dining",
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
      name: "Internet",
      baseline: baselineTier.internet_mobile_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.internet_mobile_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Entertainment",
      baseline: baselineTier.entertainment_monthly * 12 * fxUsdPerLocal,
      adjusted: adjustedTier.entertainment_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Personal",
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
      name: "Visa",
      baseline: baselineTier.visa_residency_annual * fxUsdPerLocal,
      adjusted: adjustedTier.visa_residency_annual * fxUsdPerLocal,
    },
  ].filter((entry) => entry.baseline > 0 || entry.adjusted > 0);

  return (
    <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
      <h3 className="text-sm font-semibold text-neutral-950">
        Annual spend by category
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        Baseline preset vs your current overrides, converted to USD.
      </p>
      <div ref={ref} className="mt-4 h-[360px] min-w-0" title={sourceTitle}>
        {width > 16 && height > 16 ? (
          <BarChart
            width={Math.max(width, 320)}
            height={Math.max(height, 360)}
            data={data}
            layout="vertical"
            margin={{ left: 32, right: 12 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(17,24,39,0.08)"
            />
            <Legend />
            <XAxis
              type="number"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis type="category" dataKey="name" width={96} />
            <Tooltip
              formatter={(value, name) => [
                `$${Number(value ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`,
                name === "baseline" ? "Baseline" : "Adjusted",
              ]}
            />
            <Bar dataKey="baseline" fill="#94a3b8" radius={[0, 10, 10, 0]} />
            <Bar dataKey="adjusted" fill="#0f766e" radius={[0, 10, 10, 0]} />
          </BarChart>
        ) : (
          <div className="h-full rounded-2xl bg-neutral-100" />
        )}
      </div>
    </div>
  );
}
