import { describe, expect, it } from "vitest";
import { computeTotalTax } from "./tax";

describe("computeTotalTax", () => {
  it("taxes taxable bucket as LTCG plus NIIT plus state", () => {
    const result = computeTotalTax({
      taxableGross: 300000,
      traditionalGross: 0,
      rothGross: 0,
      costBasisPct: 0.65,
      stateCode: "NONE",
    });

    expect(result.federalLtcg).toBeCloseTo((105000 - 48350) * 0.15, 2);
    expect(result.federalOrdinary).toBe(0);
    expect(result.niit).toBe(0);
    expect(result.stateTax).toBe(0);
    expect(result.totalTax).toBeCloseTo(result.federalLtcg, 2);
  });

  it("taxes traditional withdrawals as ordinary income", () => {
    const result = computeTotalTax({
      taxableGross: 0,
      traditionalGross: 100000,
      rothGross: 0,
      costBasisPct: 0.65,
      stateCode: "NONE",
    });

    expect(result.federalOrdinary).toBeCloseTo(1192.5 + 4386 + 8035.5, 2);
  });

  it("treats Roth withdrawals as tax free", () => {
    const result = computeTotalTax({
      taxableGross: 0,
      traditionalGross: 0,
      rothGross: 200000,
      costBasisPct: 0.65,
      stateCode: "CA",
    });

    expect(result.totalTax).toBe(0);
  });

  it("triggers NIIT on high gains", () => {
    const result = computeTotalTax({
      taxableGross: 800000,
      traditionalGross: 0,
      rothGross: 0,
      costBasisPct: 0,
      stateCode: "NONE",
    });

    expect(result.niit).toBeCloseTo(22800, 2);
  });
});
