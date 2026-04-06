import { describe, expect, it } from "vitest";
import { solveGrossWithdrawal } from "./withdrawal";

describe("solveGrossWithdrawal", () => {
  it("marks a normal case as converged", () => {
    const result = solveGrossWithdrawal({
      netSpendTarget: 100_000,
      taxablePct: 0.7,
      traditionalPct: 0.2,
      rothPct: 0.1,
      costBasisPct: 0.65,
      filingStatus: "single",
      stateCode: "NONE",
      strategy: "proportional",
      swr: 0.04,
    });

    expect(result.converged).toBe(true);
    expect(result.iterations).toBeGreaterThan(0);
  });

  it("reports telemetry when no iterations are allowed", () => {
    const result = solveGrossWithdrawal(
      {
        netSpendTarget: 100_000,
        taxablePct: 0.7,
        traditionalPct: 0.2,
        rothPct: 0.1,
        costBasisPct: 0.65,
        filingStatus: "single",
        stateCode: "NONE",
        strategy: "proportional",
        swr: 0.04,
      },
      { maxIterations: 0 }
    );

    expect(result.converged).toBe(false);
    expect(result.iterations).toBe(0);
    expect(result.residual).toBeGreaterThan(0);
  });

  it("makes tax_optimal materially different from proportional", () => {
    const proportional = solveGrossWithdrawal({
      netSpendTarget: 120_000,
      taxablePct: 0.7,
      traditionalPct: 0.2,
      rothPct: 0.1,
      costBasisPct: 0.65,
      filingStatus: "single",
      stateCode: "NONE",
      strategy: "proportional",
      swr: 0.04,
    });

    const taxOptimal = solveGrossWithdrawal({
      netSpendTarget: 120_000,
      taxablePct: 0.7,
      traditionalPct: 0.2,
      rothPct: 0.1,
      costBasisPct: 0.65,
      filingStatus: "single",
      stateCode: "NONE",
      strategy: "tax_optimal",
      swr: 0.04,
    });

    expect(taxOptimal.breakdown.federalOrdinary).toBe(0);
    expect(taxOptimal.breakdown.totalTax).toBeLessThan(
      proportional.breakdown.totalTax
    );
    expect(taxOptimal.gross).toBeLessThan(proportional.gross);
  });
});
