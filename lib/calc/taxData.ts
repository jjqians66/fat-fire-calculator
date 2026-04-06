import usFederal from "@/data/tax/us-federal.json";
import usStates from "@/data/tax/us-states.json";
import { FederalTaxDataSchema, StateTaxDataSchema } from "./schema";
import type { FederalFilingStatus } from "./types";

export interface TaxBracket {
  upTo: number | null;
  rate: number;
}

export interface FederalTaxStatusData {
  longTermCapitalGains: { brackets: TaxBracket[] };
  niit: { threshold: number; rate: number };
  ordinaryIncome: { brackets: TaxBracket[] };
  standardDeduction: number;
}

export interface FederalTaxData {
  year: number;
  filingStatuses: Record<FederalFilingStatus, FederalTaxStatusData>;
  notes?: string;
}

export interface StateTaxEntry {
  name: string;
  capGainsRate: number;
  ordinaryRateTop: number;
  treatsLTCGAsOrdinary: boolean;
}

export interface StateTaxData {
  year: number;
  states: Record<string, StateTaxEntry>;
  notes?: string;
}

export const federalTax =
  FederalTaxDataSchema.parse(usFederal) as FederalTaxData;
export const stateTax = StateTaxDataSchema.parse(usStates) as StateTaxData;

export function getFederalTax(
  filingStatus: FederalFilingStatus
): FederalTaxStatusData {
  return federalTax.filingStatuses[filingStatus] ?? federalTax.filingStatuses.single;
}

export function getStateTax(code: string): StateTaxEntry {
  return stateTax.states[code] ?? stateTax.states.NONE!;
}
