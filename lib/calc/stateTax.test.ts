import { describe, expect, it } from "vitest";
import { computeStateTax } from "./tax";

describe("computeStateTax", () => {
  it("is zero for a no-tax state", () => {
    expect(computeStateTax(100000, 50000, "TX")).toBe(0);
  });

  it("applies top ordinary rate when LTCG is treated as ordinary", () => {
    expect(computeStateTax(50000, 30000, "CA")).toBeCloseTo(80000 * 0.133, 2);
  });

  it("taxes only capital gains in Washington", () => {
    expect(computeStateTax(50000, 30000, "WA")).toBeCloseTo(3500, 2);
  });
});
