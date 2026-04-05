import type { TierCosts } from "./types";

export interface AnnualSpendResult {
  base: number;
  total: number;
}

export function computeAnnualSpend(
  tier: TierCosts,
  annualHousing: number
): AnnualSpendResult {
  const monthlySum =
    tier.groceries_monthly +
    tier.dining_out_monthly +
    tier.transport_monthly +
    tier.healthcare_monthly +
    tier.utilities_monthly +
    tier.internet_mobile_monthly +
    tier.entertainment_monthly +
    tier.personal_services_monthly +
    tier.domestic_help_monthly +
    tier.luxury_misc_monthly;

  const annualSum =
    tier.education_annual +
    tier.travel_annual +
    tier.legal_tax_compliance_annual +
    tier.visa_residency_annual;

  const base = monthlySum * 12 + annualSum + annualHousing;
  const total = base * (1 + tier.contingency_pct);

  return { base, total };
}
