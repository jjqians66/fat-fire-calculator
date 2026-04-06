import { computeTotalTax, type TaxBreakdown } from "./tax";
import type { FederalFilingStatus, WithdrawalStrategy } from "./types";

export interface WithdrawalInput {
  netSpendTarget: number;
  taxablePct: number;
  traditionalPct: number;
  rothPct: number;
  costBasisPct: number;
  filingStatus: FederalFilingStatus;
  stateCode: string;
  strategy: WithdrawalStrategy;
  swr: number;
}

export interface WithdrawalResult {
  gross: number;
  breakdown: TaxBreakdown;
  iterations: number;
  converged: boolean;
  residual: number;
}

function allocate(gross: number, input: WithdrawalInput) {
  if (input.strategy === "proportional") {
    return {
      taxable: gross * input.taxablePct,
      traditional: gross * input.traditionalPct,
      roth: gross * input.rothPct,
    };
  }

  const swr = Math.max(input.swr, 0.0001);
  const impliedPortfolio = gross / swr;
  const taxableCap = impliedPortfolio * input.taxablePct;
  const traditionalCap = impliedPortfolio * input.traditionalPct;
  const rothCap = impliedPortfolio * input.rothPct;

  let remaining = gross;
  const taxable = Math.min(remaining, taxableCap);
  remaining -= taxable;
  const traditional = Math.min(remaining, traditionalCap);
  remaining -= traditional;
  const roth = Math.min(remaining, rothCap);
  remaining -= roth;

  return {
    taxable,
    traditional,
    roth: roth + remaining,
  };
}

export function solveGrossWithdrawal(
  input: WithdrawalInput,
  options?: {
    maxIterations?: number;
    tolerance?: number;
  }
): WithdrawalResult {
  let gross = input.netSpendTarget;
  let breakdown: TaxBreakdown = {
    federalLtcg: 0,
    federalOrdinary: 0,
    niit: 0,
    stateTax: 0,
    totalTax: 0,
  };
  const maxIterations = options?.maxIterations ?? 30;
  const tolerance = options?.tolerance ?? 0.01;

  let iteration = 0;
  let residual = input.netSpendTarget;
  for (; iteration < maxIterations; iteration += 1) {
    const allocation = allocate(gross, input);
    breakdown = computeTotalTax({
      taxableGross: allocation.taxable,
      traditionalGross: allocation.traditional,
      rothGross: allocation.roth,
      costBasisPct: input.costBasisPct,
      filingStatus: input.filingStatus,
      stateCode: input.stateCode,
    });

    const net = gross - breakdown.totalTax;
    const error = input.netSpendTarget - net;
    residual = error;
    if (Math.abs(error) < tolerance) break;
    gross += error;
  }
  const converged = Math.abs(residual) < tolerance;
  const iterationsRun =
    iteration === maxIterations ? maxIterations : iteration + 1;

  return {
    gross,
    breakdown,
    iterations: iterationsRun,
    converged,
    residual,
  };
}
