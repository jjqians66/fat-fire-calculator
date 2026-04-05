import { z } from "zod";

const nonNegative = z.number().nonnegative();
const percent = z.number().min(0).max(1);

export const TierCostsSchema = z.object({
  description: z.string().min(1),
  groceries_monthly: nonNegative,
  dining_out_monthly: nonNegative,
  transport_monthly: nonNegative,
  healthcare_monthly: nonNegative,
  utilities_monthly: nonNegative,
  internet_mobile_monthly: nonNegative,
  entertainment_monthly: nonNegative,
  personal_services_monthly: nonNegative,
  domestic_help_monthly: nonNegative,
  luxury_misc_monthly: nonNegative,
  education_annual: nonNegative,
  travel_annual: nonNegative,
  legal_tax_compliance_annual: nonNegative,
  visa_residency_annual: nonNegative,
  contingency_pct: percent,
});

export const HousingDataSchema = z.object({
  rent_1br_central_monthly: nonNegative,
  rent_3br_central_monthly: nonNegative,
  rent_1br_suburb_monthly: nonNegative,
  rent_3br_suburb_monthly: nonNegative,
  buy_price_per_sqm_central: nonNegative,
  buy_price_per_sqm_suburb: nonNegative,
  property_tax_annual_pct: percent,
  maintenance_annual_pct: percent,
});

export const FxSnapshotSchema = z.object({
  referenceRateUsdPerLocal: z.number().positive(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional(),
});

export const CityDataSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  country: z.string().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/),
  locale: z.string().min(2),
  lastUpdated: z.string().regex(/^\d{4}-Q[1-4]$/),
  sources: z
    .array(z.string().regex(/\b20\d{2}\b/, "Source must include a year"))
    .min(2),
  lifestyle: z.string().min(40).optional(),
  fx: FxSnapshotSchema,
  housing: HousingDataSchema,
  tiers: z.object({
    true_fat_fire: TierCostsSchema,
    comfortable_expat: TierCostsSchema,
    luxury_family: TierCostsSchema,
  }),
});

export const TaxBracketSchema = z.object({
  upTo: z.number().positive().nullable(),
  rate: percent,
});

export const FederalTaxDataSchema = z.object({
  year: z.number().int().positive(),
  filingStatus: z.string().min(1),
  longTermCapitalGains: z.object({
    brackets: z.array(TaxBracketSchema).min(1),
  }),
  niit: z.object({
    threshold: nonNegative,
    rate: percent,
  }),
  ordinaryIncome: z.object({
    brackets: z.array(TaxBracketSchema).min(1),
  }),
  standardDeduction: nonNegative,
  notes: z.string().optional(),
});

export const StateTaxEntrySchema = z.object({
  name: z.string().min(1),
  capGainsRate: percent,
  ordinaryRateTop: percent,
  treatsLTCGAsOrdinary: z.boolean(),
});

export const StateTaxDataSchema = z.object({
  year: z.number().int().positive(),
  states: z.record(z.string().min(1), StateTaxEntrySchema),
  notes: z.string().optional(),
});

export type CityDataParsed = z.infer<typeof CityDataSchema>;
