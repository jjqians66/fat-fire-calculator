import { applyHouseholdProfile } from "./household";
import { computeHousing } from "./housing";
import { computeAnnualSpend } from "./spend";
import type { CalcInputs, CalcResult, CityData, TierCosts } from "./types";
import { solveGrossWithdrawal } from "./withdrawal";

function mergeOverrides(
  tier: TierCosts,
  overrides: Partial<TierCosts>
): TierCosts {
  return { ...tier, ...overrides };
}

function computeYearsToFire(
  targetCapital: number,
  currentPortfolioUsd: number,
  annualSavingsUsd: number,
  realReturn: number
): number | null {
  if (currentPortfolioUsd <= 0 || annualSavingsUsd <= 0) {
    return null;
  }

  let portfolio = currentPortfolioUsd;
  for (let year = 1; year <= 100; year += 1) {
    portfolio = portfolio * (1 + realReturn) + annualSavingsUsd;
    if (portfolio >= targetCapital) {
      return year;
    }
  }

  return null;
}

export function computeFireNumber(
  city: CityData,
  inputs: CalcInputs,
  fxUsdPerLocal: number
): CalcResult {
  const warnings: string[] = [];
  const tierBase = city.tiers[inputs.tier];
  const adjustedTier = applyHouseholdProfile(
    tierBase,
    inputs.household,
    inputs.kidsCount
  );
  const finalTier = mergeOverrides(adjustedTier, inputs.categoryOverrides);

  const housing = computeHousing(city.housing, {
    mode: inputs.housingMode,
    area: inputs.housingArea,
    size: inputs.housingSize,
    homeSqm: inputs.homeSqm,
  });

  const spend = computeAnnualSpend(finalTier, housing.annualHousingLocal);
  const annualSpendUsd = spend.total * fxUsdPerLocal;

  const withdrawal = solveGrossWithdrawal({
    netSpendTarget: annualSpendUsd,
    taxablePct: inputs.portfolio.taxablePct,
    traditionalPct: inputs.portfolio.traditionalPct,
    rothPct: inputs.portfolio.rothPct,
    costBasisPct: inputs.portfolio.costBasisPct,
    stateCode: inputs.usStateCode,
    strategy: inputs.withdrawalStrategy,
  });

  const fireNumberUsd = withdrawal.gross / inputs.swr;
  const homeValueUsd = housing.homeValueLocal * fxUsdPerLocal;
  const totalCapitalNeededUsd = fireNumberUsd + homeValueUsd;

  const horizon = inputs.lifeExpectancy - inputs.retirementAge;
  if (inputs.swr >= 0.04 && horizon >= 40) {
    warnings.push(
      `SWR of ${(inputs.swr * 100).toFixed(1)}% over ${horizon}yr horizon is aggressive; consider 3.25–3.5%.`
    );
  }
  if (inputs.portfolio.costBasisPct >= 0.95) {
    warnings.push(
      "Very high cost basis assumption; realized gains could be larger in practice."
    );
  }
  if (inputs.usStateCode === "CA" || inputs.usStateCode === "NY") {
    warnings.push(
      `${inputs.usStateCode} residency assumptions depend on actually changing domicile before retirement.`
    );
  }
  warnings.push(
    "Local city taxes on investment withdrawals are not added; foreign tax credits and treaty treatment vary."
  );

  const yearsToFire = computeYearsToFire(
    totalCapitalNeededUsd,
    inputs.currentPortfolioUsd ?? 0,
    inputs.annualSavingsUsd ?? 0,
    inputs.realReturn ?? 0.05
  );

  return {
    annualSpendUsd,
    grossWithdrawalUsd: withdrawal.gross,
    taxBreakdown: withdrawal.breakdown,
    fireNumberUsd,
    homeValueUsd,
    totalCapitalNeededUsd,
    yearsToFire,
    warnings,
  };
}
