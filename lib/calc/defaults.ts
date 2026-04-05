import assumptions from "@/data/assumptions.json";
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
  portfolio: assumptions.defaultPortfolio,
  usStateCode: "NONE",
  swr: assumptions.defaultSwr,
  withdrawalStrategy: "proportional",
  retirementAge: assumptions.defaultRetirementAge,
  lifeExpectancy: assumptions.defaultLifeExpectancy,
  realReturn: assumptions.defaultRealReturn,
  inflation: assumptions.defaultInflation,
  currentPortfolioUsd: 0,
  annualSavingsUsd: 0,
};
