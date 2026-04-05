import { computeTotalTax, type TaxBreakdown } from "./tax";
import type { WithdrawalStrategy } from "./types";

export interface WithdrawalInput {
  netSpendTarget: number;
  taxablePct: number;
  traditionalPct: number;
  rothPct: number;
  costBasisPct: number;
  stateCode: string;
  strategy: WithdrawalStrategy;
}

export interface WithdrawalResult {
  gross: number;
  breakdown: TaxBreakdown;
  iterations: number;
}

function allocate(gross: number, input: WithdrawalInput) {
  if (input.strategy === "proportional") {
    return {
      taxable: gross * input.taxablePct,
      traditional: gross * input.traditionalPct,
      roth: gross * input.rothPct,
    };
  }

  let remaining = gross;
  const taxableCap = gross * input.taxablePct;
  const traditionalCap = gross * input.traditionalPct;

  const taxable = Math.min(remaining, taxableCap);
  remaining -= taxable;
  const traditional = Math.min(remaining, traditionalCap);
  remaining -= traditional;

  return {
    taxable,
    traditional,
    roth: remaining,
  };
}

export function solveGrossWithdrawal(
  input: WithdrawalInput
): WithdrawalResult {
  let gross = input.netSpendTarget;
  let breakdown: TaxBreakdown = {
    federalLtcg: 0,
    federalOrdinary: 0,
    niit: 0,
    stateTax: 0,
    totalTax: 0,
  };
  const maxIterations = 30;
  const tolerance = 0.01;

  let iteration = 0;
  for (; iteration < maxIterations; iteration += 1) {
    const allocation = allocate(gross, input);
    breakdown = computeTotalTax({
      taxableGross: allocation.taxable,
      traditionalGross: allocation.traditional,
      rothGross: allocation.roth,
      costBasisPct: input.costBasisPct,
      stateCode: input.stateCode,
    });

    const net = gross - breakdown.totalTax;
    const error = input.netSpendTarget - net;
    if (Math.abs(error) < tolerance) break;
    gross += error;
  }

  return {
    gross,
    breakdown,
    iterations: iteration + 1,
  };
}
