import { describe, expect, it } from "vitest";
import { solveGrossWithdrawal } from "./withdrawal";

describe("solveGrossWithdrawal", () => {
  it("returns net spend when taxes are zero", () => {
    const result = solveGrossWithdrawal({
      netSpendTarget: 120000,
      taxablePct: 0,
      traditionalPct: 0,
      rothPct: 1,
      costBasisPct: 0.65,
      stateCode: "NONE",
      strategy: "proportional",
    });

    expect(result.gross).toBeCloseTo(120000, 0);
    expect(result.breakdown.totalTax).toBe(0);
  });

  it("grosses up for taxes with a mixed portfolio", () => {
    const result = solveGrossWithdrawal({
      netSpendTarget: 150000,
      taxablePct: 0.7,
      traditionalPct: 0.2,
      rothPct: 0.1,
      costBasisPct: 0.65,
      stateCode: "CA",
      strategy: "proportional",
    });

    expect(result.gross).toBeGreaterThan(150000);
    expect(result.gross - result.breakdown.totalTax).toBeCloseTo(150000, 0);
  });

  it("converges within max iterations", () => {
    const result = solveGrossWithdrawal({
      netSpendTarget: 500000,
      taxablePct: 1,
      traditionalPct: 0,
      rothPct: 0,
      costBasisPct: 0,
      stateCode: "NY",
      strategy: "proportional",
    });

    expect(result.iterations).toBeLessThanOrEqual(20);
    expect(result.gross - result.breakdown.totalTax).toBeCloseTo(500000, 0);
  });
});
