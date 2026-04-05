import type { HousingData, HousingMode } from "./types";

export interface HousingChoice {
  mode: HousingMode;
  area: "central" | "suburb";
  size: "1br" | "3br";
  homeSqm: number;
}

export interface HousingResult {
  annualHousingLocal: number;
  homeValueLocal: number;
}

export function computeHousing(
  housing: HousingData,
  choice: HousingChoice
): HousingResult {
  if (choice.mode === "rent") {
    const key = `rent_${choice.size}_${choice.area}_monthly` as keyof HousingData;
    const monthly = housing[key] as number;
    return { annualHousingLocal: monthly * 12, homeValueLocal: 0 };
  }

  const pricePerSqm =
    choice.area === "central"
      ? housing.buy_price_per_sqm_central
      : housing.buy_price_per_sqm_suburb;
  const homeValue = pricePerSqm * choice.homeSqm;
  const carryCost =
    homeValue *
    (housing.property_tax_annual_pct + housing.maintenance_annual_pct);

  return { annualHousingLocal: carryCost, homeValueLocal: homeValue };
}
