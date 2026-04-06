"use client";

import { useMeasuredDimensions } from "@/components/results/useMeasuredDimensions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TaxBreakdownChartProps {
  grossWithdrawalUsd: number;
  federalLtcg: number;
  federalOrdinary: number;
  niit: number;
  stateTax: number;
  sourceTitle?: string;
}

export function TaxBreakdownChart({
  grossWithdrawalUsd,
  federalLtcg,
  federalOrdinary,
  niit,
  stateTax,
  sourceTitle,
}: TaxBreakdownChartProps) {
  const { t, locale } = useLocale();
  const displayLocale = locale === "zh" ? "zh-CN" : "en-US";
  const { ref, width, height } = useMeasuredDimensions();
  const totalTax = federalLtcg + federalOrdinary + niit + stateTax;
  const data = [
    {
      name: t.calc.taxSegments.grossWithdrawal,
      netSpend: Math.max(0, grossWithdrawalUsd - totalTax) / 12,
      federalLtcg: federalLtcg / 12,
      federalOrdinary: federalOrdinary / 12,
      niit: niit / 12,
      stateTax: stateTax / 12,
    },
  ];

  return (
    <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
      <h3 className="text-sm font-semibold text-neutral-950">
        {t.calc.taxChartTitle}
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        {t.calc.taxChartSub}
      </p>
      <div ref={ref} className="mt-4 h-[220px] min-w-0" title={sourceTitle}>
        {width > 16 && height > 16 ? (
          <BarChart
            width={Math.max(width, 320)}
            height={Math.max(height, 220)}
            data={data}
            layout="vertical"
            margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.08)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              formatter={(value, name) => [
                `$${Number(value ?? 0).toLocaleString(displayLocale, {
                  maximumFractionDigits: 0,
                })}`,
                t.calc.taxSegments[name as keyof typeof t.calc.taxSegments] ?? String(name),
              ]}
            />
            <Bar dataKey="netSpend" stackId="a" fill="#0f766e" radius={[10, 0, 0, 10]} />
            <Bar dataKey="federalLtcg" stackId="a" fill="#7c3aed" />
            <Bar dataKey="federalOrdinary" stackId="a" fill="#ea580c" />
            <Bar dataKey="niit" stackId="a" fill="#dc2626" />
            <Bar dataKey="stateTax" stackId="a" fill="#2563eb" radius={[0, 10, 10, 0]} />
          </BarChart>
        ) : (
          <div className="h-full rounded-2xl bg-neutral-100" />
        )}
      </div>
    </div>
  );
}
