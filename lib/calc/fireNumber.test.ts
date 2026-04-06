import { describe, expect, it } from "vitest";
import { computeFireNumber } from "./fireNumber";
import type { CalcInputs, CityData } from "./types";

function tierStub(monthlyEach: number, educationAnnual: number) {
  return {
    description: "s",
    guide: {
      groceries: "Premium groceries with imported staples.",
      dining: "Dining out a few times a week with the occasional splurge.",
      rhythm: "Regular transport, services, and entertainment spending.",
    },
    groceries_monthly: monthlyEach,
    dining_out_monthly: monthlyEach,
    transport_monthly: monthlyEach,
    healthcare_monthly: monthlyEach,
    utilities_monthly: monthlyEach,
    internet_mobile_monthly: monthlyEach,
    entertainment_monthly: monthlyEach,
    personal_services_monthly: monthlyEach,
    domestic_help_monthly: monthlyEach,
    luxury_misc_monthly: monthlyEach,
    education_annual: educationAnnual,
    travel_annual: 1000000,
    legal_tax_compliance_annual: 400000,
    visa_residency_annual: 150000,
    contingency_pct: 0.1,
  };
}

const city: CityData = {
  slug: "tokyo",
  name: "Tokyo",
  country: "Japan",
  currency: "JPY",
  locale: "ja-JP",
  lastUpdated: "2026-Q1",
  sources: ["a", "b"],
  fx: { referenceRateUsdPerLocal: 0.0067, asOf: "2026-01-15" },
  housing: {
    rent_1br_central_monthly: 220000,
    rent_3br_central_monthly: 520000,
    rent_1br_suburb_monthly: 130000,
    rent_3br_suburb_monthly: 280000,
    buy_price_per_sqm_central: 2100000,
    buy_price_per_sqm_suburb: 900000,
    property_tax_annual_pct: 0.014,
    maintenance_annual_pct: 0.01,
  },
  tiers: {
    true_fat_fire: tierStub(200000, 200000000),
    comfortable_expat: tierStub(100000, 100000000),
    luxury_family: tierStub(250000, 300000000),
  },
};

const baseInputs: CalcInputs = {
  tier: "comfortable_expat",
  household: "couple",
  kidsCount: 0,
  housingMode: "rent",
  housingArea: "central",
  housingSize: "1br",
  homeSqm: 0,
  categoryOverrides: {},
  portfolio: {
    taxablePct: 0.7,
    traditionalPct: 0.2,
    rothPct: 0.1,
    costBasisPct: 0.65,
  },
  filingStatus: "married_filing_jointly",
  usStateCode: "NONE",
  swr: 0.0325,
  withdrawalStrategy: "proportional",
  retirementAge: 45,
  lifeExpectancy: 95,
};

describe("computeFireNumber", () => {
  it("produces a positive FIRE number", () => {
    const result = computeFireNumber(city, baseInputs, 0.0067);
    expect(result.fireNumberUsd).toBeGreaterThan(0);
    expect(result.annualSpendUsd).toBeGreaterThan(0);
    expect(result.grossWithdrawalUsd).toBeGreaterThanOrEqual(
      result.annualSpendUsd
    );
  });

  it("adds home value in own mode", () => {
    const ownInputs: CalcInputs = {
      ...baseInputs,
      housingMode: "own",
      homeSqm: 80,
    };
    const result = computeFireNumber(city, ownInputs, 0.0067);
    expect(result.homeValueUsd).toBeGreaterThan(0);
    expect(result.totalCapitalNeededUsd).toBeCloseTo(
      result.fireNumberUsd + result.homeValueUsd,
      0
    );
  });

  it("increases with a higher tier", () => {
    const comfortable = computeFireNumber(city, baseInputs, 0.0067);
    const fat = computeFireNumber(
      city,
      { ...baseInputs, tier: "true_fat_fire" },
      0.0067
    );
    expect(fat.fireNumberUsd).toBeGreaterThan(comfortable.fireNumberUsd);
  });

  it("increases for a CA resident", () => {
    const noState = computeFireNumber(city, baseInputs, 0.0067);
    const california = computeFireNumber(
      city,
      { ...baseInputs, usStateCode: "CA" },
      0.0067
    );
    expect(california.fireNumberUsd).toBeGreaterThan(noState.fireNumberUsd);
  });

  it("drops for MFJ versus single on the same couple household", () => {
    const single = computeFireNumber(
      city,
      { ...baseInputs, filingStatus: "single" },
      0.0067
    );
    const married = computeFireNumber(city, baseInputs, 0.0067);
    expect(married.fireNumberUsd).toBeLessThan(single.fireNumberUsd);
  });
});
