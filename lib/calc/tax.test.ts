import { describe, expect, it } from "vitest";
import {
  applyBrackets,
  computeLtcgTax,
  computeNiit,
  computeOrdinaryTax,
} from "./tax";
import type { TaxBracket } from "./taxData";

const ltcgBrackets: TaxBracket[] = [
  { upTo: 48350, rate: 0.0 },
  { upTo: 533400, rate: 0.15 },
  { upTo: null, rate: 0.2 },
];

describe("applyBrackets", () => {
  it("returns 0 for amount in zero bracket", () => {
    expect(applyBrackets(40000, ltcgBrackets)).toBe(0);
  });

  it("applies a single bracket when all in one tier", () => {
    expect(applyBrackets(100000, ltcgBrackets)).toBeCloseTo(51650 * 0.15, 2);
  });

  it("crosses all three brackets", () => {
    const expected = (533400 - 48350) * 0.15 + (600000 - 533400) * 0.2;
    expect(applyBrackets(600000, ltcgBrackets)).toBeCloseTo(expected, 2);
  });
});

describe("computeLtcgTax", () => {
  it("computes LTCG on gains portion only", () => {
    expect(computeLtcgTax(100000, 0.65)).toBe(0);
  });

  it("pushes gains into the 15% bracket", () => {
    expect(computeLtcgTax(200000, 0)).toBeCloseTo(
      (200000 - 48350) * 0.15,
      2
    );
  });
});

describe("computeNiit", () => {
  it("is zero below threshold", () => {
    expect(computeNiit(150000)).toBe(0);
  });

  it("applies 3.8% above threshold", () => {
    expect(computeNiit(300000)).toBeCloseTo(100000 * 0.038, 2);
  });
});

describe("computeOrdinaryTax", () => {
  it("applies standard deduction", () => {
    expect(computeOrdinaryTax(20000)).toBeCloseTo(500, 2);
  });

  it("returns 0 if below standard deduction", () => {
    expect(computeOrdinaryTax(10000)).toBe(0);
  });
});
