"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TierCosts } from "@/lib/calc/types";

interface SpendChartProps {
  tier: TierCosts;
  fxUsdPerLocal: number;
  annualHousingLocal: number;
}

export function SpendChart({
  tier,
  fxUsdPerLocal,
  annualHousingLocal,
}: SpendChartProps) {
  const data = [
    { name: "Housing", value: annualHousingLocal * fxUsdPerLocal },
    { name: "Groceries", value: tier.groceries_monthly * 12 * fxUsdPerLocal },
    { name: "Dining", value: tier.dining_out_monthly * 12 * fxUsdPerLocal },
    { name: "Transport", value: tier.transport_monthly * 12 * fxUsdPerLocal },
    { name: "Healthcare", value: tier.healthcare_monthly * 12 * fxUsdPerLocal },
    { name: "Utilities", value: tier.utilities_monthly * 12 * fxUsdPerLocal },
    { name: "Internet", value: tier.internet_mobile_monthly * 12 * fxUsdPerLocal },
    { name: "Entertainment", value: tier.entertainment_monthly * 12 * fxUsdPerLocal },
    {
      name: "Personal",
      value: tier.personal_services_monthly * 12 * fxUsdPerLocal,
    },
    {
      name: "Domestic help",
      value: tier.domestic_help_monthly * 12 * fxUsdPerLocal,
    },
    { name: "Luxury misc", value: tier.luxury_misc_monthly * 12 * fxUsdPerLocal },
    { name: "Education", value: tier.education_annual * fxUsdPerLocal },
    { name: "Travel", value: tier.travel_annual * fxUsdPerLocal },
    {
      name: "Legal / tax",
      value: tier.legal_tax_compliance_annual * fxUsdPerLocal,
    },
    { name: "Visa", value: tier.visa_residency_annual * fxUsdPerLocal },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
      <h3 className="text-sm font-semibold text-neutral-950">
        Annual spend by category
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        City preset plus your current overrides, converted to USD.
      </p>
      <div className="mt-4 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 32 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(17,24,39,0.08)"
            />
            <XAxis
              type="number"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis type="category" dataKey="name" width={96} />
            <Tooltip
              formatter={(value) =>
                `$${Number(value ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`
              }
            />
            <Bar dataKey="value" fill="#0f766e" radius={[0, 10, 10, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
