import { describe, expect, it } from "vitest";
import { computeAnnualSpend } from "./spend";
import type { TierCosts } from "./types";

const tier: TierCosts = {
  description: "t",
  groceries_monthly: 10000,
  dining_out_monthly: 10000,
  transport_monthly: 5000,
  healthcare_monthly: 5000,
  utilities_monthly: 2000,
  internet_mobile_monthly: 1000,
  entertainment_monthly: 5000,
  personal_services_monthly: 3000,
  domestic_help_monthly: 6000,
  luxury_misc_monthly: 3000,
  education_annual: 100000,
  travel_annual: 120000,
  legal_tax_compliance_annual: 30000,
  visa_residency_annual: 10000,
  contingency_pct: 0.1,
};

describe("computeAnnualSpend", () => {
  it("sums categories and applies contingency", () => {
    const result = computeAnnualSpend(tier, 0);
    expect(result.base).toBe(860000);
    expect(result.total).toBeCloseTo(946000, 0);
  });

  it("includes housing before contingency", () => {
    const result = computeAnnualSpend(tier, 100000);
    expect(result.base).toBe(960000);
    expect(result.total).toBeCloseTo(1056000, 0);
  });
});
