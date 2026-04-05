import type { HouseholdProfile, TierCosts } from "./types";

export function applyHouseholdProfile(
  tier: TierCosts,
  profile: HouseholdProfile,
  kidsCount: number
): TierCosts {
  const result: TierCosts = { ...tier };

  if (profile === "single") {
    result.education_annual = 0;
    result.groceries_monthly = tier.groceries_monthly * 0.6;
    result.healthcare_monthly = tier.healthcare_monthly * 0.55;
    result.domestic_help_monthly = tier.domestic_help_monthly * 0.5;
    result.travel_annual = tier.travel_annual * 0.7;
    return result;
  }

  if (profile === "couple") {
    result.education_annual = 0;
    return result;
  }

  const childCount = Math.max(1, kidsCount);
  result.education_annual = tier.education_annual * childCount;
  result.groceries_monthly = tier.groceries_monthly * (1 + childCount * 0.35);
  result.healthcare_monthly = tier.healthcare_monthly * (1 + childCount * 0.4);
  result.travel_annual = tier.travel_annual * (1 + childCount * 0.25);
  return result;
}
