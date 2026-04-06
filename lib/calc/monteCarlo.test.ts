import { describe, expect, it } from "vitest";
import {
  computePortfolioVolatility,
  createSeededRandom,
  runMonteCarlo,
} from "./monteCarlo";

describe("monteCarlo", () => {
  it("returns 100% success when there is no spending drag", () => {
    const result = runMonteCarlo({
      annualSpendUsd: 0,
      currentPortfolioUsd: 1_000_000,
      retirementAge: 45,
      lifeExpectancy: 90,
      stockAllocationPct: 0.6,
      expectedRealReturn: 0.05,
      trials: 1000,
      rng: createSeededRandom(42),
    });

    expect(result.successRate).toBe(1);
    expect(result.percentile10Trajectory).toHaveLength(46);
  });

  it("returns 0% success when spending immediately exhausts the portfolio", () => {
    const result = runMonteCarlo({
      annualSpendUsd: 200_000,
      currentPortfolioUsd: 100_000,
      retirementAge: 50,
      lifeExpectancy: 90,
      stockAllocationPct: 0.6,
      expectedRealReturn: 0.05,
      trials: 500,
      rng: createSeededRandom(7),
    });

    expect(result.successRate).toBe(0);
    expect(result.percentile10EndingPortfolioUsd).toBe(0);
  });

  it("increases volatility as stock allocation rises", () => {
    expect(computePortfolioVolatility(0.2)).toBeLessThan(
      computePortfolioVolatility(0.8)
    );
  });
});
