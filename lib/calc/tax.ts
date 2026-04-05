import { federalTax, getStateTax, type TaxBracket } from "./taxData";

export interface TaxInput {
  taxableGross: number;
  traditionalGross: number;
  rothGross: number;
  costBasisPct: number;
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
  costBasisPct: number
): number {
  const gain = Math.max(0, grossWithdrawal * (1 - costBasisPct));
  return applyBrackets(gain, federalTax.longTermCapitalGains.brackets);
}

export function computeNiit(investmentIncome: number): number {
  const { threshold, rate } = federalTax.niit;
  return Math.max(0, investmentIncome - threshold) * rate;
}

export function computeOrdinaryTax(grossIncome: number): number {
  const taxableIncome = Math.max(0, grossIncome - federalTax.standardDeduction);
  return applyBrackets(taxableIncome, federalTax.ordinaryIncome.brackets);
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
  const gain = input.taxableGross * (1 - input.costBasisPct);
  const federalLtcg = computeLtcgTax(input.taxableGross, input.costBasisPct);
  const federalOrdinary = computeOrdinaryTax(input.traditionalGross);
  const niit = computeNiit(gain);
  const stateTax = computeStateTax(gain, input.traditionalGross, input.stateCode);
  const totalTax = federalLtcg + federalOrdinary + niit + stateTax;

  return { federalLtcg, federalOrdinary, niit, stateTax, totalTax };
}
