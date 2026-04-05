import { describe, expect, it } from "vitest";
import { computeHousing } from "./housing";
import type { HousingData } from "./types";

const housing: HousingData = {
  rent_1br_central_monthly: 220000,
  rent_3br_central_monthly: 520000,
  rent_1br_suburb_monthly: 130000,
  rent_3br_suburb_monthly: 280000,
  buy_price_per_sqm_central: 2100000,
  buy_price_per_sqm_suburb: 900000,
  property_tax_annual_pct: 0.014,
  maintenance_annual_pct: 0.01,
};

describe("computeHousing", () => {
  it("computes central 1BR rent", () => {
    const result = computeHousing(housing, {
      mode: "rent",
      area: "central",
      size: "1br",
      homeSqm: 0,
    });

    expect(result.annualHousingLocal).toBe(220000 * 12);
    expect(result.homeValueLocal).toBe(0);
  });

  it("computes suburb 3BR rent", () => {
    const result = computeHousing(housing, {
      mode: "rent",
      area: "suburb",
      size: "3br",
      homeSqm: 0,
    });

    expect(result.annualHousingLocal).toBe(280000 * 12);
  });

  it("computes owned housing carry costs", () => {
    const result = computeHousing(housing, {
      mode: "own",
      area: "central",
      size: "1br",
      homeSqm: 80,
    });

    expect(result.homeValueLocal).toBe(2100000 * 80);
    expect(result.annualHousingLocal).toBeCloseTo(2100000 * 80 * 0.024, 2);
  });
});
