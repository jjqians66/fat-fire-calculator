"use client";

import { useMeasuredDimensions } from "@/components/results/useMeasuredDimensions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonteCarloTrajectoryPoint } from "@/lib/calc/monteCarlo";

interface MonteCarloChartProps {
  data: MonteCarloTrajectoryPoint[];
}

export function MonteCarloChart({ data }: MonteCarloChartProps) {
  const { t, locale } = useLocale();
  const displayLocale = locale === "zh" ? "zh-CN" : "en-US";
  const { ref, width, height } = useMeasuredDimensions();

  return (
    <div>
      <h4 className="text-sm font-semibold text-neutral-900">{t.calc.percentilePath}</h4>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        {t.calc.realSpendingAssumption}
      </p>
      <div ref={ref} className="mt-4 h-[220px] min-w-0">
        {width > 16 && height > 16 ? (
          <LineChart
            width={Math.max(width, 320)}
            height={Math.max(height, 220)}
            data={data}
            margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.08)" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                `$${Number(value).toLocaleString(displayLocale, {
                  maximumFractionDigits: 0,
                })}`
              }
            />
            <Tooltip
              formatter={(value) => [
                `$${Number(value ?? 0).toLocaleString(displayLocale, {
                  maximumFractionDigits: 0,
                })}`,
                t.calc.percentilePath,
              ]}
            />
            <Line
              type="monotone"
              dataKey="portfolioUsd"
              stroke="#0f766e"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        ) : (
          <div className="h-full rounded-2xl bg-neutral-100" />
        )}
      </div>
    </div>
  );
}
