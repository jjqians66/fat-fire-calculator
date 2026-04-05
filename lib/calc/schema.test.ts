import { describe, expect, it } from "vitest";
import usFederal from "@/data/tax/us-federal.json";
import usStates from "@/data/tax/us-states.json";
import { CityDataSchema } from "./schema";
import { FederalTaxDataSchema, StateTaxDataSchema } from "./schema";

function makeTier(desc: string) {
  return {
    description: desc,
    groceries_monthly: 100000,
    dining_out_monthly: 100000,
    transport_monthly: 50000,
    healthcare_monthly: 50000,
    utilities_monthly: 20000,
    internet_mobile_monthly: 10000,
    entertainment_monthly: 50000,
    personal_services_monthly: 30000,
    domestic_help_monthly: 30000,
    luxury_misc_monthly: 30000,
    education_annual: 1000000,
    travel_annual: 1000000,
    legal_tax_compliance_annual: 300000,
    visa_residency_annual: 100000,
    contingency_pct: 0.1,
  };
}

const validCity = {
  slug: "tokyo",
  name: "Tokyo",
  country: "Japan",
  currency: "JPY",
  locale: "ja-JP",
  lastUpdated: "2026-Q1",
  sources: ["Numbeo 2026-01", "Mercer 2025"],
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
    true_fat_fire: makeTier("uncompromised"),
    comfortable_expat: makeTier("mid-tier"),
    luxury_family: makeTier("family"),
  },
};

describe("CityDataSchema", () => {
  it("accepts a valid city", () => {
    const result = CityDataSchema.safeParse(validCity);
    expect(result.success).toBe(true);
  });

  it("requires at least 2 sources", () => {
    const result = CityDataSchema.safeParse({
      ...validCity,
      sources: ["only one"],
    });
    expect(result.success).toBe(false);
  });

  it("requires source strings to include a year", () => {
    const result = CityDataSchema.safeParse({
      ...validCity,
      sources: ["Numbeo", "Mercer"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative costs", () => {
    const result = CityDataSchema.safeParse({
      ...validCity,
      housing: { ...validCity.housing, rent_1br_central_monthly: -1 },
    });
    expect(result.success).toBe(false);
  });

  it("requires all three tiers", () => {
    const { luxury_family, ...rest } = validCity.tiers;
    void luxury_family;
    const result = CityDataSchema.safeParse({ ...validCity, tiers: rest });
    expect(result.success).toBe(false);
  });
});

describe("tax data schemas", () => {
  it("accepts federal tax data", () => {
    expect(FederalTaxDataSchema.safeParse(usFederal).success).toBe(true);
  });

  it("accepts state tax data", () => {
    expect(StateTaxDataSchema.safeParse(usStates).success).toBe(true);
  });
});
