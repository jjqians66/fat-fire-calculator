import { describe, expect, it } from "vitest";
import { applyHouseholdProfile } from "./household";
import type { TierCosts } from "./types";

const baseTier: TierCosts = {
  description: "test",
  groceries_monthly: 100000,
  dining_out_monthly: 100000,
  transport_monthly: 50000,
  healthcare_monthly: 50000,
  utilities_monthly: 20000,
  internet_mobile_monthly: 10000,
  entertainment_monthly: 50000,
  personal_services_monthly: 30000,
  domestic_help_monthly: 60000,
  luxury_misc_monthly: 30000,
  education_annual: 3000000,
  travel_annual: 1000000,
  legal_tax_compliance_annual: 400000,
  visa_residency_annual: 150000,
  contingency_pct: 0.1,
};

describe("applyHouseholdProfile", () => {
  it("single zeros education and reduces some categories", () => {
    const result = applyHouseholdProfile(baseTier, "single", 0);
    expect(result.education_annual).toBe(0);
    expect(result.domestic_help_monthly).toBeLessThan(
      baseTier.domestic_help_monthly
    );
    expect(result.healthcare_monthly).toBeLessThan(baseTier.healthcare_monthly);
  });

  it("couple with no kids zeros education", () => {
    const result = applyHouseholdProfile(baseTier, "couple", 0);
    expect(result.education_annual).toBe(0);
  });

  it("family scales education linearly with kids", () => {
    const result = applyHouseholdProfile(baseTier, "family", 2);
    expect(result.education_annual).toBe(baseTier.education_annual * 2);
  });

  it("family increases groceries and healthcare", () => {
    const result = applyHouseholdProfile(baseTier, "family", 2);
    expect(result.groceries_monthly).toBeGreaterThan(baseTier.groceries_monthly);
    expect(result.healthcare_monthly).toBeGreaterThan(baseTier.healthcare_monthly);
  });
});
