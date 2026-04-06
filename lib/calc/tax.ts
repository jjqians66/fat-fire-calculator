import { getFederalTax, getStateTax, type TaxBracket } from "./taxData";
import type { FederalFilingStatus } from "./types";

export interface TaxInput {
  taxableGross: number;
  traditionalGross: number;
  rothGross: number;
  costBasisPct: number;
  filingStatus: FederalFilingStatus;
  stateCode: string;
}

export interface TaxBreakdown {
  federalLtcg: number;
  federalOrdinary: number;
  niit: number;
  stateTax: number;
  totalTax: number;
}

export function applyBrackets(amount: number, brackets: TaxBracket[]): number {
  if (amount <= 0) return 0;

  let tax = 0;
  let previousCap = 0;

  for (const bracket of brackets) {
    const upperCap = bracket.upTo ?? Number.POSITIVE_INFINITY;
    if (amount <= previousCap) break;

    const slice = Math.min(amount, upperCap) - previousCap;
    if (slice > 0) {
      tax += slice * bracket.rate;
    }

    previousCap = upperCap;
    if (amount <= upperCap) {
      break;
    }
  }

  return tax;
}

export function computeLtcgTax(
  grossWithdrawal: number,
  costBasisPct: number,
  filingStatus: FederalFilingStatus,
  ordinaryTaxableIncome = 0
): number {
  const gain = Math.max(0, grossWithdrawal * (1 - costBasisPct));
  if (gain <= 0) return 0;
  // LTCG stacks on top of ordinary taxable income: tax on the slice from
  // [ordinary, ordinary + gain] using LTCG brackets.
  const base = Math.max(0, ordinaryTaxableIncome);
  const brackets = getFederalTax(filingStatus).longTermCapitalGains.brackets;
  return applyBrackets(base + gain, brackets) - applyBrackets(base, brackets);
}

export function computeNiit(
  gain: number,
  magi: number,
  filingStatus: FederalFilingStatus
): number {
  const { threshold, rate } = getFederalTax(filingStatus).niit;
  const overThreshold = Math.max(0, magi - threshold);
  const base = Math.min(Math.max(0, gain), overThreshold);
  return base * rate;
}

export function computeOrdinaryTax(
  grossIncome: number,
  filingStatus: FederalFilingStatus
): number {
  const taxableIncome = ordinaryTaxableIncome(grossIncome, filingStatus);
  return applyBrackets(
    taxableIncome,
    getFederalTax(filingStatus).ordinaryIncome.brackets
  );
}

export function ordinaryTaxableIncome(
  grossIncome: number,
  filingStatus: FederalFilingStatus
): number {
  return Math.max(0, grossIncome - getFederalTax(filingStatus).standardDeduction);
}

export function computeStateTax(
  ltcgAmount: number,
  ordinaryAmount: number,
  stateCode: string
): number {
  const state = getStateTax(stateCode);
  if (state.treatsLTCGAsOrdinary) {
    return (ltcgAmount + ordinaryAmount) * state.ordinaryRateTop;
  }
  return (
    ltcgAmount * state.capGainsRate + ordinaryAmount * state.ordinaryRateTop
  );
}

export function computeTotalTax(input: TaxInput): TaxBreakdown {
  void input.rothGross;
  const gain = Math.max(0, input.taxableGross * (1 - input.costBasisPct));
  const ordinaryTaxable = ordinaryTaxableIncome(
    input.traditionalGross,
    input.filingStatus
  );
  const federalLtcg = computeLtcgTax(
    input.taxableGross,
    input.costBasisPct,
    input.filingStatus,
    ordinaryTaxable
  );
  const federalOrdinary = computeOrdinaryTax(
    input.traditionalGross,
    input.filingStatus
  );
  // MAGI ≈ ordinary taxable income + investment gain for a portfolio-only retiree.
  const magi = ordinaryTaxable + gain;
  const niit = computeNiit(gain, magi, input.filingStatus);
  const stateTax = computeStateTax(gain, input.traditionalGross, input.stateCode);
  const totalTax = federalLtcg + federalOrdinary + niit + stateTax;

  return { federalLtcg, federalOrdinary, niit, stateTax, totalTax };
}
