import type { CalcInputs } from "./types";

export const DEFAULT_INPUTS: CalcInputs = {
  tier: "comfortable_expat",
  household: "couple",
  kidsCount: 0,
  housingMode: "rent",
  housingArea: "central",
  housingSize: "1br",
  homeSqm: 80,
  categoryOverrides: {},
  portfolio: {
    taxablePct: 0.7,
    traditionalPct: 0.2,
    rothPct: 0.1,
    costBasisPct: 0.65,
  },
  usStateCode: "NONE",
  swr: 0.0325,
  withdrawalStrategy: "proportional",
  retirementAge: 45,
  lifeExpectancy: 95,
  realReturn: 0.05,
  inflation: 0.025,
  currentPortfolioUsd: 0,
  annualSavingsUsd: 0,
};
