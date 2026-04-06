export type Currency = string;

export type TierKey = "true_fat_fire" | "comfortable_expat" | "luxury_family";

export type HouseholdProfile = "single" | "couple" | "family";

export type HousingMode = "rent" | "own";

export type WithdrawalStrategy = "proportional" | "tax_optimal";

export type FederalFilingStatus = "single" | "married_filing_jointly";

export interface TierLifestyleGuide {
  groceries: string;
  dining: string;
  rhythm: string;
}

export interface TierCosts {
  description: string;
  guide: TierLifestyleGuide;
  groceries_monthly: number;
  dining_out_monthly: number;
  transport_monthly: number;
  healthcare_monthly: number;
  utilities_monthly: number;
  internet_mobile_monthly: number;
  entertainment_monthly: number;
  personal_services_monthly: number;
  domestic_help_monthly: number;
  luxury_misc_monthly: number;
  education_annual: number;
  travel_annual: number;
  legal_tax_compliance_annual: number;
  visa_residency_annual: number;
  contingency_pct: number;
}

export interface HousingData {
  rent_1br_central_monthly: number;
  rent_3br_central_monthly: number;
  rent_1br_suburb_monthly: number;
  rent_3br_suburb_monthly: number;
  buy_price_per_sqm_central: number;
  buy_price_per_sqm_suburb: number;
  property_tax_annual_pct: number;
  maintenance_annual_pct: number;
}

export interface FxSnapshot {
  referenceRateUsdPerLocal: number;
  asOf: string;
  note?: string;
}

export interface CityData {
  slug: string;
  name: string;
  country: string;
  currency: Currency;
  locale: string;
  lastUpdated: string;
  sources: string[];
  lifestyle?: string;
  fx: FxSnapshot;
  housing: HousingData;
  tiers: Record<TierKey, TierCosts>;
}

export interface PortfolioComposition {
  taxablePct: number;
  traditionalPct: number;
  rothPct: number;
  costBasisPct: number;
}

export type TierCostOverrides = Partial<Omit<TierCosts, "description" | "guide">>;

export interface CalcInputs {
  tier: TierKey;
  household: HouseholdProfile;
  kidsCount: number;
  housingMode: HousingMode;
  housingArea: "central" | "suburb";
  housingSize: "1br" | "3br";
  homeSqm: number;
  categoryOverrides: TierCostOverrides;
  portfolio: PortfolioComposition;
  filingStatus: FederalFilingStatus;
  usStateCode: string;
  swr: number;
  withdrawalStrategy: WithdrawalStrategy;
  retirementAge: number;
  lifeExpectancy: number;
  stockAllocationPct?: number;
  realReturn?: number;
  inflation?: number;
  currentPortfolioUsd?: number;
  annualSavingsUsd?: number;
}

export interface CalcResult {
  annualSpendUsd: number;
  grossWithdrawalUsd: number;
  taxBreakdown: {
    federalLtcg: number;
    federalOrdinary: number;
    niit: number;
    stateTax: number;
    totalTax: number;
  };
  fireNumberUsd: number;
  homeValueUsd: number;
  totalCapitalNeededUsd: number;
  yearsToFire: number | null;
  warnings: CalcWarning[];
}

export type CalcWarning =
  | {
      key: "aggressive_swr";
      swrPct: number;
      horizonYears: number;
    }
  | {
      key: "high_cost_basis";
    }
  | {
      key: "domicile_required";
      stateCode: string;
    }
  | {
      key: "solver_not_converged";
      residualUsd: number;
      iterations: number;
    }
  | {
      key: "local_taxes_omitted";
    };
