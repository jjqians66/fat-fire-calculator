import { describe, expect, it } from "vitest";
import {
  applyBrackets,
  computeLtcgTax,
  computeNiit,
  computeOrdinaryTax,
} from "./tax";
import type { TaxBracket } from "./taxData";

const ltcgBrackets: TaxBracket[] = [
  { upTo: 49450, rate: 0.0 },
  { upTo: 545500, rate: 0.15 },
  { upTo: null, rate: 0.2 },
];

describe("applyBrackets", () => {
  it("returns 0 for amount in zero bracket", () => {
    expect(applyBrackets(40000, ltcgBrackets)).toBe(0);
  });

  it("applies a single bracket when all in one tier", () => {
    expect(applyBrackets(100000, ltcgBrackets)).toBeCloseTo(50550 * 0.15, 2);
  });

  it("crosses all three brackets", () => {
    const expected = (545500 - 49450) * 0.15 + (600000 - 545500) * 0.2;
    expect(applyBrackets(600000, ltcgBrackets)).toBeCloseTo(expected, 2);
  });
});

describe("computeLtcgTax", () => {
  it("computes LTCG on gains portion only", () => {
    expect(computeLtcgTax(100000, 0.65)).toBe(0);
  });

  it("pushes gains into the 15% bracket", () => {
    expect(computeLtcgTax(200000, 0)).toBeCloseTo(
      (200000 - 49450) * 0.15,
      2
    );
  });

  it("stacks on top of ordinary taxable income", () => {
    // Ordinary taxable $60k consumes the 0% LTCG band ($49,450).
    // A $50k gain sits entirely in the 15% LTCG bracket.
    expect(computeLtcgTax(50000, 0, 60000)).toBeCloseTo(50000 * 0.15, 2);
  });

  it("uses remaining 0% band when ordinary income is low", () => {
    // Ordinary taxable $20k leaves $29,450 of 0% band, then 15%.
    // $50k gain: first $29,450 at 0%, next $20,550 at 15%.
    expect(computeLtcgTax(50000, 0, 20000)).toBeCloseTo(20550 * 0.15, 2);
  });
});

describe("computeNiit", () => {
  it("is zero below threshold", () => {
    expect(computeNiit(150000, 150000)).toBe(0);
  });

  it("applies 3.8% above threshold", () => {
    expect(computeNiit(300000, 300000)).toBeCloseTo(100000 * 0.038, 2);
  });

  it("stacks ordinary income into MAGI", () => {
    // $120k gain, $120k ordinary → MAGI $240k, over threshold by $40k,
    // NIIT base = min(gain, $40k) = $40k
    expect(computeNiit(120000, 240000)).toBeCloseTo(40000 * 0.038, 2);
  });

  it("caps NIIT at the investment income amount", () => {
    // $10k gain, $300k MAGI → over threshold by $100k but gain is only $10k
    expect(computeNiit(10000, 300000)).toBeCloseTo(10000 * 0.038, 2);
  });
});

describe("computeOrdinaryTax", () => {
  it("applies standard deduction", () => {
    expect(computeOrdinaryTax(20000)).toBeCloseTo(390, 2);
  });

  it("returns 0 if below standard deduction", () => {
    expect(computeOrdinaryTax(10000)).toBe(0);
  });
});
