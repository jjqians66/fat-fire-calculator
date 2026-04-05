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

interface TaxBreakdownChartProps {
  grossWithdrawalUsd: number;
  federalLtcg: number;
  federalOrdinary: number;
  niit: number;
  stateTax: number;
}

export function TaxBreakdownChart({
  grossWithdrawalUsd,
  federalLtcg,
  federalOrdinary,
  niit,
  stateTax,
}: TaxBreakdownChartProps) {
  const totalTax = federalLtcg + federalOrdinary + niit + stateTax;
  const data = [
    {
      name: "Gross withdrawal",
      netSpend: Math.max(0, grossWithdrawalUsd - totalTax),
      federalLtcg,
      federalOrdinary,
      niit,
      stateTax,
    },
  ];

  return (
    <div className="rounded-[24px] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]">
      <h3 className="text-sm font-semibold text-neutral-950">
        Gross withdrawal composition
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        See how much of the gross annual draw becomes spendable net cash.
      </p>
      <div className="mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 16, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.08)" />
            <XAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <YAxis hide />
            <Tooltip
              formatter={(value) =>
                `$${Number(value ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`
              }
            />
            <Bar dataKey="federalLtcg" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="federalOrdinary" stackId="a" fill="#ea580c" radius={[0, 0, 0, 0]} />
            <Bar dataKey="niit" stackId="a" fill="#dc2626" radius={[0, 0, 0, 0]} />
            <Bar dataKey="stateTax" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
            <Bar dataKey="netSpend" stackId="a" fill="#0f766e" radius={[10, 10, 10, 10]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
