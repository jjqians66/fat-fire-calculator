# Fat FIRE City Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public Next.js web calculator that estimates the Fat FIRE portfolio size a US tax resident needs to retire in any of 9 major cities, with US-person tax modeling (federal LTCG + NIIT + state) across taxable/traditional/Roth buckets.

**Architecture:** Next.js 15 App Router + TypeScript strict + Tailwind CSS. Pure TS calculation engine in `lib/calc/` with zero React deps (unit-testable in isolation). Curated JSON city data committed to git (every cost update auditable via PR). Client-side FX fetch with reference rate fallback. No backend.

**Tech Stack:** Next.js 15, TypeScript 5.x strict, Tailwind CSS 4.x, Zod (schema validation), Vitest (unit tests), Playwright (E2E), Recharts (charts), Vercel (hosting).

**Launch cities (9):** Tokyo, Kuala Lumpur, Shanghai, Beijing, Chengdu, Seattle, Vancouver, San Francisco, New York.

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `README.md`

- [ ] **Step 1: Scaffold Next.js 15 with TypeScript and Tailwind**

Run:
```bash
cd /Users/jj/projects/fat_fire
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack --yes
```
Expected: Creates package.json, tsconfig.json, app/ directory, all config files.

- [ ] **Step 2: Enable TypeScript strict mode**

Edit `tsconfig.json`, ensure `compilerOptions` contains:
```json
"strict": true,
"noUncheckedIndexedAccess": true
```

- [ ] **Step 3: Initialize git and first commit**

Run:
```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 15 project with TypeScript and Tailwind"
```
Expected: clean working tree.

- [ ] **Step 4: Verify dev server starts**

Run: `npm run dev`
Expected: server starts on http://localhost:3000, default Next.js page renders.
Stop server with Ctrl+C.

---

### Task 2: Install additional dependencies

**Files:** Modify `package.json`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
npm install zod recharts
```

- [ ] **Step 2: Install dev deps (testing)**

Run:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @types/node
```

- [ ] **Step 3: Install Playwright for E2E**

Run:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zod, recharts, vitest, playwright"
```

---

### Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add test scripts to `package.json`**

Add under `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 4: Verify Vitest runs (empty)**

Run: `npm test`
Expected: "No test files found" — config works.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "chore: configure Vitest"
```

---

## Phase 2: Core Types & Schemas

### Task 4: Define domain types

**Files:**
- Create: `lib/calc/types.ts`

- [ ] **Step 1: Write the types file**

```ts
// lib/calc/types.ts
export type Currency = string; // ISO 4217

export type TierKey = 'true_fat_fire' | 'comfortable_expat' | 'luxury_family';

export type HouseholdProfile = 'single' | 'couple' | 'family';

export type HousingMode = 'rent' | 'own';

export type WithdrawalStrategy = 'proportional' | 'tax_optimal';

export interface TierCosts {
  description: string;
  groceries_monthly: number;
  dining_out_monthly: number;
  transport_monthly: number;
  healthcare_monthly: number;
  utilities_monthly: number;
  internet_mobile_monthly: number;
  entertainment_monthly: number;
  personal_services_monthly: number;
  domestic_help_monthly: number;
  luxury_misc_monthly: number;
  education_annual: number;
  travel_annual: number;
  legal_tax_compliance_annual: number;
  visa_residency_annual: number;
  contingency_pct: number;
}

export interface HousingData {
  rent_1br_central_monthly: number;
  rent_3br_central_monthly: number;
  rent_1br_suburb_monthly: number;
  rent_3br_suburb_monthly: number;
  buy_price_per_sqm_central: number;
  buy_price_per_sqm_suburb: number;
  property_tax_annual_pct: number;
  maintenance_annual_pct: number;
}

export interface FxSnapshot {
  referenceRateUsdPerLocal: number;
  asOf: string; // ISO date
  note?: string;
}

export interface CityData {
  slug: string;
  name: string;
  country: string;
  currency: Currency;
  locale: string;
  lastUpdated: string;
  sources: string[];
  fx: FxSnapshot;
  housing: HousingData;
  tiers: Record<TierKey, TierCosts>;
}

export interface PortfolioComposition {
  taxablePct: number;   // 0..1
  traditionalPct: number;
  rothPct: number;
  costBasisPct: number; // 0..1, cost basis fraction of taxable
}

export interface CalcInputs {
  tier: TierKey;
  household: HouseholdProfile;
  kidsCount: number;
  housingMode: HousingMode;
  housingArea: 'central' | 'suburb';
  housingSize: '1br' | '3br';
  homeSqm: number;                // used in 'own' mode
  categoryOverrides: Partial<TierCosts>;
  portfolio: PortfolioComposition;
  usStateCode: string;            // 'CA' | 'NY' | 'TX' | 'NONE' | ...
  swr: number;                    // e.g. 0.0325
  withdrawalStrategy: WithdrawalStrategy;
  retirementAge: number;
  lifeExpectancy: number;
}

export interface CalcResult {
  annualSpendUsd: number;
  grossWithdrawalUsd: number;
  taxBreakdown: {
    federalLtcg: number;
    federalOrdinary: number;
    niit: number;
    stateTax: number;
    totalTax: number;
  };
  fireNumberUsd: number;
  homeValueUsd: number;
  totalCapitalNeededUsd: number;
  warnings: string[];
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/calc/types.ts
git commit -m "feat(calc): define domain types"
```

---

### Task 5: Zod schemas for city and tax data

**Files:**
- Create: `lib/calc/schema.ts`
- Create: `lib/calc/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/schema.test.ts
import { describe, it, expect } from 'vitest';
import { CityDataSchema } from './schema';

const validCity = {
  slug: 'tokyo',
  name: 'Tokyo',
  country: 'Japan',
  currency: 'JPY',
  locale: 'ja-JP',
  lastUpdated: '2026-Q1',
  sources: ['Numbeo 2026-01', 'Mercer 2025'],
  fx: { referenceRateUsdPerLocal: 0.0067, asOf: '2026-01-15' },
  housing: {
    rent_1br_central_monthly: 220000,
    rent_3br_central_monthly: 520000,
    rent_1br_suburb_monthly: 130000,
    rent_3br_suburb_monthly: 280000,
    buy_price_per_sqm_central: 2100000,
    buy_price_per_sqm_suburb: 900000,
    property_tax_annual_pct: 0.014,
    maintenance_annual_pct: 0.010,
  },
  tiers: {
    true_fat_fire: makeTier('uncompromised'),
    comfortable_expat: makeTier('mid-tier'),
    luxury_family: makeTier('family'),
  },
};

function makeTier(desc: string) {
  return {
    description: desc,
    groceries_monthly: 100000,
    dining_out_monthly: 100000,
    transport_monthly: 50000,
    healthcare_monthly: 50000,
    utilities_monthly: 20000,
    internet_mobile_monthly: 10000,
    entertainment_monthly: 50000,
    personal_services_monthly: 30000,
    domestic_help_monthly: 30000,
    luxury_misc_monthly: 30000,
    education_annual: 1000000,
    travel_annual: 1000000,
    legal_tax_compliance_annual: 300000,
    visa_residency_annual: 100000,
    contingency_pct: 0.10,
  };
}

describe('CityDataSchema', () => {
  it('accepts a valid city', () => {
    const result = CityDataSchema.safeParse(validCity);
    expect(result.success).toBe(true);
  });

  it('requires at least 2 sources', () => {
    const result = CityDataSchema.safeParse({ ...validCity, sources: ['only one'] });
    expect(result.success).toBe(false);
  });

  it('rejects negative costs', () => {
    const bad = {
      ...validCity,
      housing: { ...validCity.housing, rent_1br_central_monthly: -1 },
    };
    const result = CityDataSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('requires all three tiers', () => {
    const { luxury_family, ...rest } = validCity.tiers;
    const result = CityDataSchema.safeParse({ ...validCity, tiers: rest });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/schema.test.ts`
Expected: FAIL (module './schema' not found).

- [ ] **Step 3: Implement `lib/calc/schema.ts`**

```ts
// lib/calc/schema.ts
import { z } from 'zod';

const nonNeg = z.number().nonnegative();
const pct = z.number().min(0).max(1);

export const TierCostsSchema = z.object({
  description: z.string().min(1),
  groceries_monthly: nonNeg,
  dining_out_monthly: nonNeg,
  transport_monthly: nonNeg,
  healthcare_monthly: nonNeg,
  utilities_monthly: nonNeg,
  internet_mobile_monthly: nonNeg,
  entertainment_monthly: nonNeg,
  personal_services_monthly: nonNeg,
  domestic_help_monthly: nonNeg,
  luxury_misc_monthly: nonNeg,
  education_annual: nonNeg,
  travel_annual: nonNeg,
  legal_tax_compliance_annual: nonNeg,
  visa_residency_annual: nonNeg,
  contingency_pct: pct,
});

export const HousingDataSchema = z.object({
  rent_1br_central_monthly: nonNeg,
  rent_3br_central_monthly: nonNeg,
  rent_1br_suburb_monthly: nonNeg,
  rent_3br_suburb_monthly: nonNeg,
  buy_price_per_sqm_central: nonNeg,
  buy_price_per_sqm_suburb: nonNeg,
  property_tax_annual_pct: pct,
  maintenance_annual_pct: pct,
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
  currency: z.string().length(3),
  locale: z.string().min(2),
  lastUpdated: z.string().min(1),
  sources: z.array(z.string().min(1)).min(2),
  fx: FxSnapshotSchema,
  housing: HousingDataSchema,
  tiers: z.object({
    true_fat_fire: TierCostsSchema,
    comfortable_expat: TierCostsSchema,
    luxury_family: TierCostsSchema,
  }),
});

export type CityDataParsed = z.infer<typeof CityDataSchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/schema.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/schema.ts lib/calc/schema.test.ts
git commit -m "feat(calc): add Zod schema for city data with validation"
```

---

## Phase 3: Tax Calculation Engine

### Task 6: US federal tax data

**Files:**
- Create: `data/tax/us-federal.json`
- Create: `lib/calc/taxData.ts`

- [ ] **Step 1: Write `data/tax/us-federal.json` (2026 brackets, single filer)**

```json
{
  "year": 2026,
  "filingStatus": "single",
  "longTermCapitalGains": {
    "brackets": [
      { "upTo": 48350, "rate": 0.0 },
      { "upTo": 533400, "rate": 0.15 },
      { "upTo": null, "rate": 0.20 }
    ]
  },
  "niit": {
    "threshold": 200000,
    "rate": 0.038
  },
  "ordinaryIncome": {
    "brackets": [
      { "upTo": 11925, "rate": 0.10 },
      { "upTo": 48475, "rate": 0.12 },
      { "upTo": 103350, "rate": 0.22 },
      { "upTo": 197300, "rate": 0.24 },
      { "upTo": 250525, "rate": 0.32 },
      { "upTo": 626350, "rate": 0.35 },
      { "upTo": null, "rate": 0.37 }
    ]
  },
  "standardDeduction": 15000,
  "notes": "2026 estimated brackets. Verify against IRS.gov before launch."
}
```

- [ ] **Step 2: Write typed loader `lib/calc/taxData.ts`**

```ts
// lib/calc/taxData.ts
import usFederal from '@/data/tax/us-federal.json';

export interface TaxBracket {
  upTo: number | null; // null = infinity
  rate: number;
}

export interface FederalTaxData {
  year: number;
  filingStatus: string;
  longTermCapitalGains: { brackets: TaxBracket[] };
  niit: { threshold: number; rate: number };
  ordinaryIncome: { brackets: TaxBracket[] };
  standardDeduction: number;
}

export const federalTax: FederalTaxData = usFederal as FederalTaxData;
```

- [ ] **Step 3: Commit**

```bash
git add data/tax/us-federal.json lib/calc/taxData.ts
git commit -m "feat(tax): add US federal 2026 tax brackets"
```

---

### Task 7: US state tax data

**Files:**
- Create: `data/tax/us-states.json`

- [ ] **Step 1: Write state tax data**

```json
{
  "year": 2026,
  "states": {
    "NONE": { "name": "No state tax", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "TX":   { "name": "Texas", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "FL":   { "name": "Florida", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "WA":   { "name": "Washington", "capGainsRate": 0.07, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "NV":   { "name": "Nevada", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "TN":   { "name": "Tennessee", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "SD":   { "name": "South Dakota", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "WY":   { "name": "Wyoming", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "AK":   { "name": "Alaska", "capGainsRate": 0.0, "ordinaryRateTop": 0.0, "treatsLTCGAsOrdinary": false },
    "NH":   { "name": "New Hampshire", "capGainsRate": 0.0, "ordinaryRateTop": 0.05, "treatsLTCGAsOrdinary": false },
    "CA":   { "name": "California", "capGainsRate": 0.133, "ordinaryRateTop": 0.133, "treatsLTCGAsOrdinary": true },
    "NY":   { "name": "New York", "capGainsRate": 0.109, "ordinaryRateTop": 0.109, "treatsLTCGAsOrdinary": true },
    "OR":   { "name": "Oregon", "capGainsRate": 0.099, "ordinaryRateTop": 0.099, "treatsLTCGAsOrdinary": true },
    "MN":   { "name": "Minnesota", "capGainsRate": 0.0985, "ordinaryRateTop": 0.0985, "treatsLTCGAsOrdinary": true },
    "NJ":   { "name": "New Jersey", "capGainsRate": 0.1075, "ordinaryRateTop": 0.1075, "treatsLTCGAsOrdinary": true },
    "MA":   { "name": "Massachusetts", "capGainsRate": 0.09, "ordinaryRateTop": 0.09, "treatsLTCGAsOrdinary": true },
    "IL":   { "name": "Illinois", "capGainsRate": 0.0495, "ordinaryRateTop": 0.0495, "treatsLTCGAsOrdinary": true },
    "CO":   { "name": "Colorado", "capGainsRate": 0.044, "ordinaryRateTop": 0.044, "treatsLTCGAsOrdinary": true },
    "AZ":   { "name": "Arizona", "capGainsRate": 0.025, "ordinaryRateTop": 0.025, "treatsLTCGAsOrdinary": true }
  },
  "notes": "Top marginal rates. Users in top brackets should assume these as effective; lower earners will see lower rates."
}
```

- [ ] **Step 2: Extend `lib/calc/taxData.ts`** with state loader:

Add at bottom of `lib/calc/taxData.ts`:
```ts
import usStates from '@/data/tax/us-states.json';

export interface StateTaxEntry {
  name: string;
  capGainsRate: number;
  ordinaryRateTop: number;
  treatsLTCGAsOrdinary: boolean;
}

export interface StateTaxData {
  year: number;
  states: Record<string, StateTaxEntry>;
}

export const stateTax: StateTaxData = usStates as StateTaxData;

export function getStateTax(code: string): StateTaxEntry {
  return stateTax.states[code] ?? stateTax.states.NONE!;
}
```

- [ ] **Step 3: Commit**

```bash
git add data/tax/us-states.json lib/calc/taxData.ts
git commit -m "feat(tax): add US state tax rates"
```

---

### Task 8: Progressive tax solver

**Files:**
- Create: `lib/calc/tax.ts`
- Create: `lib/calc/tax.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/tax.test.ts
import { describe, it, expect } from 'vitest';
import { applyBrackets, computeLtcgTax, computeOrdinaryTax, computeNiit } from './tax';
import type { TaxBracket } from './taxData';

const ltcgBrackets: TaxBracket[] = [
  { upTo: 48350, rate: 0.0 },
  { upTo: 533400, rate: 0.15 },
  { upTo: null, rate: 0.20 },
];

describe('applyBrackets', () => {
  it('returns 0 for amount in zero bracket', () => {
    expect(applyBrackets(40000, ltcgBrackets)).toBe(0);
  });

  it('applies single bracket when all in one tier', () => {
    // 100000 - 48350 = 51650 taxed at 15%
    expect(applyBrackets(100000, ltcgBrackets)).toBeCloseTo(51650 * 0.15, 2);
  });

  it('crosses all three brackets', () => {
    // 600000: 0-48350 @ 0%, 48350-533400 @ 15%, 533400-600000 @ 20%
    const expected = (533400 - 48350) * 0.15 + (600000 - 533400) * 0.20;
    expect(applyBrackets(600000, ltcgBrackets)).toBeCloseTo(expected, 2);
  });
});

describe('computeLtcgTax', () => {
  it('computes LTCG on gains portion only', () => {
    // $100k withdrawal, 65% cost basis → $35k gain
    // All in 15% bracket since < $48350
    const tax = computeLtcgTax(100_000, 0.65);
    // $35k of gain: first $48350 gets 0% → all $35k at 0%
    expect(tax).toBe(0);
  });

  it('gains into the 15% bracket', () => {
    // $200k gross, 0% basis → $200k gain
    // 0-48350 @ 0, 48350-200000 @ 15%
    const tax = computeLtcgTax(200_000, 0.0);
    expect(tax).toBeCloseTo((200_000 - 48350) * 0.15, 2);
  });
});

describe('computeNiit', () => {
  it('is zero below threshold', () => {
    expect(computeNiit(150_000)).toBe(0);
  });

  it('applies 3.8% above threshold', () => {
    // $300k investment income, $200k threshold → $100k taxed at 3.8%
    expect(computeNiit(300_000)).toBeCloseTo(100_000 * 0.038, 2);
  });
});

describe('computeOrdinaryTax', () => {
  it('applies standard deduction', () => {
    // $20k - $15k std ded = $5k taxable @ 10% = $500
    expect(computeOrdinaryTax(20_000)).toBeCloseTo(500, 2);
  });

  it('returns 0 if below standard deduction', () => {
    expect(computeOrdinaryTax(10_000)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/tax.test.ts`
Expected: FAIL (module './tax' not found).

- [ ] **Step 3: Implement `lib/calc/tax.ts`**

```ts
// lib/calc/tax.ts
import { federalTax, type TaxBracket } from './taxData';

/** Apply progressive bracket rates to an amount. Returns tax owed. */
export function applyBrackets(amount: number, brackets: TaxBracket[]): number {
  if (amount <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    if (amount <= prev) break;
    const slice = Math.min(amount, cap) - prev;
    if (slice > 0) tax += slice * b.rate;
    prev = cap;
    if (amount <= cap) break;
  }
  return tax;
}

/** LTCG tax on a gross withdrawal from a taxable account, given cost basis fraction. */
export function computeLtcgTax(grossWithdrawal: number, costBasisPct: number): number {
  const gain = Math.max(0, grossWithdrawal * (1 - costBasisPct));
  return applyBrackets(gain, federalTax.longTermCapitalGains.brackets);
}

/** NIIT on investment income above the threshold. */
export function computeNiit(investmentIncome: number): number {
  const { threshold, rate } = federalTax.niit;
  return Math.max(0, investmentIncome - threshold) * rate;
}

/** Federal ordinary income tax, applying standard deduction. */
export function computeOrdinaryTax(grossIncome: number): number {
  const taxable = Math.max(0, grossIncome - federalTax.standardDeduction);
  return applyBrackets(taxable, federalTax.ordinaryIncome.brackets);
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/tax.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/tax.ts lib/calc/tax.test.ts
git commit -m "feat(tax): progressive bracket solver with LTCG, NIIT, ordinary income"
```

---

### Task 9: State tax on withdrawals

**Files:**
- Modify: `lib/calc/tax.ts`
- Create: `lib/calc/stateTax.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/stateTax.test.ts
import { describe, it, expect } from 'vitest';
import { computeStateTax } from './tax';

describe('computeStateTax', () => {
  it('is zero for no-tax state', () => {
    expect(computeStateTax(100_000, 50_000, 'TX')).toBe(0);
  });

  it('applies flat cap gains rate for flat-tax states', () => {
    // CA treats LTCG as ordinary at 13.3% (we use top marginal as effective)
    // $50k ltcg + $30k ordinary = $80k @ 13.3%
    expect(computeStateTax(50_000, 30_000, 'CA')).toBeCloseTo(80_000 * 0.133, 2);
  });

  it('WA only taxes cap gains, not ordinary', () => {
    // WA: capGainsRate 7%, ordinaryRateTop 0%, doesn't treat LTCG as ordinary
    // $50k ltcg @ 7% + $30k ordinary @ 0% = $3500
    expect(computeStateTax(50_000, 30_000, 'WA')).toBeCloseTo(3500, 2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/stateTax.test.ts`
Expected: FAIL (computeStateTax not exported).

- [ ] **Step 3: Add `computeStateTax` to `lib/calc/tax.ts`**

Append to `lib/calc/tax.ts`:
```ts
import { getStateTax } from './taxData';

/**
 * State tax on ltcg + ordinary withdrawal amounts.
 * For states that treat LTCG as ordinary, use ordinaryRateTop on combined amount.
 * For states with separate cap gains handling (e.g., WA), apply each rate separately.
 */
export function computeStateTax(
  ltcgAmount: number,
  ordinaryAmount: number,
  stateCode: string
): number {
  const s = getStateTax(stateCode);
  if (s.treatsLTCGAsOrdinary) {
    return (ltcgAmount + ordinaryAmount) * s.ordinaryRateTop;
  }
  return ltcgAmount * s.capGainsRate + ordinaryAmount * s.ordinaryRateTop;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/stateTax.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/tax.ts lib/calc/stateTax.test.ts
git commit -m "feat(tax): add state tax on withdrawals"
```

---

### Task 10: Total tax on bucketed withdrawals

**Files:**
- Modify: `lib/calc/tax.ts`
- Create: `lib/calc/bucketTax.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/bucketTax.test.ts
import { describe, it, expect } from 'vitest';
import { computeTotalTax } from './tax';

describe('computeTotalTax', () => {
  it('taxes taxable bucket as LTCG + NIIT + state', () => {
    // $300k from taxable, 65% basis → $105k gain
    // LTCG: 0-48350 @ 0%, 48350-105000 @ 15% = $8497.50
    // NIIT: $105k gain below $200k threshold → 0
    // State NONE: 0
    const r = computeTotalTax({
      taxableGross: 300_000,
      traditionalGross: 0,
      rothGross: 0,
      costBasisPct: 0.65,
      stateCode: 'NONE',
    });
    expect(r.federalLtcg).toBeCloseTo((105_000 - 48350) * 0.15, 2);
    expect(r.federalOrdinary).toBe(0);
    expect(r.niit).toBe(0);
    expect(r.stateTax).toBe(0);
    expect(r.totalTax).toBeCloseTo(r.federalLtcg, 2);
  });

  it('taxes traditional as ordinary income', () => {
    // $100k from traditional: $100k - $15k std ded = $85k taxable
    // 0-11925 @ 10% = 1192.50; 11925-48475 @ 12% = 4386; 48475-85000 @ 22% = 8035.50
    const r = computeTotalTax({
      taxableGross: 0,
      traditionalGross: 100_000,
      rothGross: 0,
      costBasisPct: 0.65,
      stateCode: 'NONE',
    });
    expect(r.federalOrdinary).toBeCloseTo(1192.50 + 4386 + 8035.50, 2);
  });

  it('Roth is tax-free', () => {
    const r = computeTotalTax({
      taxableGross: 0,
      traditionalGross: 0,
      rothGross: 200_000,
      costBasisPct: 0.65,
      stateCode: 'CA',
    });
    expect(r.totalTax).toBe(0);
  });

  it('NIIT triggers on high taxable gain', () => {
    // $800k taxable, 0% basis → $800k gain (investment income)
    // $800k - $200k threshold = $600k * 3.8% = $22,800 NIIT
    const r = computeTotalTax({
      taxableGross: 800_000,
      traditionalGross: 0,
      rothGross: 0,
      costBasisPct: 0.0,
      stateCode: 'NONE',
    });
    expect(r.niit).toBeCloseTo(22_800, 2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/bucketTax.test.ts`
Expected: FAIL (computeTotalTax not exported).

- [ ] **Step 3: Add `computeTotalTax` to `lib/calc/tax.ts`**

Append to `lib/calc/tax.ts`:
```ts
export interface TaxInput {
  taxableGross: number;
  traditionalGross: number;
  rothGross: number;
  costBasisPct: number;
  stateCode: string;
}

export interface TaxBreakdown {
  federalLtcg: number;
  federalOrdinary: number;
  niit: number;
  stateTax: number;
  totalTax: number;
}

export function computeTotalTax(input: TaxInput): TaxBreakdown {
  const gain = input.taxableGross * (1 - input.costBasisPct);
  const federalLtcg = computeLtcgTax(input.taxableGross, input.costBasisPct);
  const federalOrdinary = computeOrdinaryTax(input.traditionalGross);
  const niit = computeNiit(gain);
  const stateTax = computeStateTax(gain, input.traditionalGross, input.stateCode);
  const totalTax = federalLtcg + federalOrdinary + niit + stateTax;
  return { federalLtcg, federalOrdinary, niit, stateTax, totalTax };
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/bucketTax.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/tax.ts lib/calc/bucketTax.test.ts
git commit -m "feat(tax): combine bucket taxes (LTCG + NIIT + ordinary + state)"
```

---

## Phase 4: Withdrawal & FIRE Number Engine

### Task 11: Gross withdrawal solver

**Files:**
- Create: `lib/calc/withdrawal.ts`
- Create: `lib/calc/withdrawal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/withdrawal.test.ts
import { describe, it, expect } from 'vitest';
import { solveGrossWithdrawal } from './withdrawal';

describe('solveGrossWithdrawal', () => {
  it('returns net spend when tax rate is 0 (NONE state, all Roth)', () => {
    const r = solveGrossWithdrawal({
      netSpendTarget: 120_000,
      taxablePct: 0, traditionalPct: 0, rothPct: 1,
      costBasisPct: 0.65,
      stateCode: 'NONE',
      strategy: 'proportional',
    });
    expect(r.gross).toBeCloseTo(120_000, 0);
    expect(r.breakdown.totalTax).toBe(0);
  });

  it('grosses up for taxes with 70/20/10 split, CA resident', () => {
    const r = solveGrossWithdrawal({
      netSpendTarget: 150_000,
      taxablePct: 0.70, traditionalPct: 0.20, rothPct: 0.10,
      costBasisPct: 0.65,
      stateCode: 'CA',
      strategy: 'proportional',
    });
    // Should gross up — expect gross > net
    expect(r.gross).toBeGreaterThan(150_000);
    // Verify: gross - tax ≈ net
    expect(r.gross - r.breakdown.totalTax).toBeCloseTo(150_000, 0);
  });

  it('converges within max iterations', () => {
    const r = solveGrossWithdrawal({
      netSpendTarget: 500_000,
      taxablePct: 1, traditionalPct: 0, rothPct: 0,
      costBasisPct: 0.0,
      stateCode: 'NY',
      strategy: 'proportional',
    });
    expect(r.iterations).toBeLessThanOrEqual(20);
    expect(r.gross - r.breakdown.totalTax).toBeCloseTo(500_000, 0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/withdrawal.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/calc/withdrawal.ts`**

```ts
// lib/calc/withdrawal.ts
import { computeTotalTax, type TaxBreakdown } from './tax';
import type { WithdrawalStrategy } from './types';

export interface WithdrawalInput {
  netSpendTarget: number;
  taxablePct: number;
  traditionalPct: number;
  rothPct: number;
  costBasisPct: number;
  stateCode: string;
  strategy: WithdrawalStrategy;
}

export interface WithdrawalResult {
  gross: number;
  breakdown: TaxBreakdown;
  iterations: number;
}

/** Allocate a gross withdrawal across buckets per strategy. */
function allocate(
  gross: number,
  input: WithdrawalInput
): { taxable: number; traditional: number; roth: number } {
  if (input.strategy === 'proportional') {
    return {
      taxable: gross * input.taxablePct,
      traditional: gross * input.traditionalPct,
      roth: gross * input.rothPct,
    };
  }
  // tax_optimal: taxable first, then traditional, then roth
  // (proportions used only as caps; here we assume gross can exceed a bucket's capacity
  //  but for a single-year withdrawal we treat proportions as the bucket weights available)
  const taxableMax = gross * input.taxablePct / Math.max(input.taxablePct, 0.0001);
  // simpler: for annual draw, still draw in order but cap by pct
  let remaining = gross;
  const taxable = Math.min(remaining, gross * input.taxablePct);
  remaining -= taxable;
  const traditional = Math.min(remaining, gross * input.traditionalPct);
  remaining -= traditional;
  const roth = remaining;
  return { taxable, traditional, roth };
}

/** Iteratively solve for gross withdrawal such that gross - tax(gross) = netSpendTarget. */
export function solveGrossWithdrawal(input: WithdrawalInput): WithdrawalResult {
  let gross = input.netSpendTarget; // start with no-tax estimate
  let breakdown: TaxBreakdown = {
    federalLtcg: 0, federalOrdinary: 0, niit: 0, stateTax: 0, totalTax: 0,
  };
  const MAX_ITER = 20;
  const TOL = 1;
  let i = 0;
  for (; i < MAX_ITER; i++) {
    const alloc = allocate(gross, input);
    breakdown = computeTotalTax({
      taxableGross: alloc.taxable,
      traditionalGross: alloc.traditional,
      rothGross: alloc.roth,
      costBasisPct: input.costBasisPct,
      stateCode: input.stateCode,
    });
    const net = gross - breakdown.totalTax;
    const err = input.netSpendTarget - net;
    if (Math.abs(err) < TOL) break;
    gross += err; // fixed-point iteration
  }
  return { gross, breakdown, iterations: i + 1 };
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/withdrawal.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/withdrawal.ts lib/calc/withdrawal.test.ts
git commit -m "feat(calc): iterative gross-withdrawal solver"
```

---

### Task 12: Housing cost calculation

**Files:**
- Create: `lib/calc/housing.ts`
- Create: `lib/calc/housing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/housing.test.ts
import { describe, it, expect } from 'vitest';
import { computeHousing } from './housing';
import type { HousingData } from './types';

const housing: HousingData = {
  rent_1br_central_monthly: 220_000,
  rent_3br_central_monthly: 520_000,
  rent_1br_suburb_monthly: 130_000,
  rent_3br_suburb_monthly: 280_000,
  buy_price_per_sqm_central: 2_100_000,
  buy_price_per_sqm_suburb: 900_000,
  property_tax_annual_pct: 0.014,
  maintenance_annual_pct: 0.010,
};

describe('computeHousing', () => {
  it('rent central 1BR → 220000 * 12', () => {
    const r = computeHousing(housing, {
      mode: 'rent', area: 'central', size: '1br', homeSqm: 0,
    });
    expect(r.annualHousingLocal).toBe(220_000 * 12);
    expect(r.homeValueLocal).toBe(0);
  });

  it('rent suburb 3BR', () => {
    const r = computeHousing(housing, {
      mode: 'rent', area: 'suburb', size: '3br', homeSqm: 0,
    });
    expect(r.annualHousingLocal).toBe(280_000 * 12);
  });

  it('own central 80sqm → homeValue and annual carry cost', () => {
    const r = computeHousing(housing, {
      mode: 'own', area: 'central', size: '1br', homeSqm: 80,
    });
    expect(r.homeValueLocal).toBe(2_100_000 * 80);
    // carry = homeValue * (0.014 + 0.010)
    expect(r.annualHousingLocal).toBeCloseTo(2_100_000 * 80 * 0.024, 2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/housing.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/calc/housing.ts`**

```ts
// lib/calc/housing.ts
import type { HousingData, HousingMode } from './types';

export interface HousingChoice {
  mode: HousingMode;
  area: 'central' | 'suburb';
  size: '1br' | '3br';
  homeSqm: number;
}

export interface HousingResult {
  annualHousingLocal: number;
  homeValueLocal: number; // nonzero only in 'own' mode
}

export function computeHousing(h: HousingData, c: HousingChoice): HousingResult {
  if (c.mode === 'rent') {
    const key = `rent_${c.size}_${c.area}_monthly` as keyof HousingData;
    const monthly = h[key] as number;
    return { annualHousingLocal: monthly * 12, homeValueLocal: 0 };
  }
  const pricePerSqm = c.area === 'central' ? h.buy_price_per_sqm_central : h.buy_price_per_sqm_suburb;
  const homeValue = pricePerSqm * c.homeSqm;
  const carry = homeValue * (h.property_tax_annual_pct + h.maintenance_annual_pct);
  return { annualHousingLocal: carry, homeValueLocal: homeValue };
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/housing.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/housing.ts lib/calc/housing.test.ts
git commit -m "feat(calc): housing cost (rent/own) computation"
```

---

### Task 13: Household profile application

**Files:**
- Create: `lib/calc/household.ts`
- Create: `lib/calc/household.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/household.test.ts
import { describe, it, expect } from 'vitest';
import { applyHouseholdProfile } from './household';
import type { TierCosts } from './types';

const baseTier: TierCosts = {
  description: 'test',
  groceries_monthly: 100_000,
  dining_out_monthly: 100_000,
  transport_monthly: 50_000,
  healthcare_monthly: 50_000,
  utilities_monthly: 20_000,
  internet_mobile_monthly: 10_000,
  entertainment_monthly: 50_000,
  personal_services_monthly: 30_000,
  domestic_help_monthly: 60_000,
  luxury_misc_monthly: 30_000,
  education_annual: 3_000_000,
  travel_annual: 1_000_000,
  legal_tax_compliance_annual: 400_000,
  visa_residency_annual: 150_000,
  contingency_pct: 0.10,
};

describe('applyHouseholdProfile', () => {
  it('single: zeros education, reduces domestic_help and healthcare', () => {
    const r = applyHouseholdProfile(baseTier, 'single', 0);
    expect(r.education_annual).toBe(0);
    expect(r.domestic_help_monthly).toBeLessThan(baseTier.domestic_help_monthly);
    expect(r.healthcare_monthly).toBeLessThan(baseTier.healthcare_monthly);
  });

  it('couple with no kids: zeros education', () => {
    const r = applyHouseholdProfile(baseTier, 'couple', 0);
    expect(r.education_annual).toBe(0);
  });

  it('family with 2 kids: scales education linearly', () => {
    const r = applyHouseholdProfile(baseTier, 'family', 2);
    expect(r.education_annual).toBe(baseTier.education_annual * 2);
  });

  it('family scales groceries and healthcare', () => {
    const r = applyHouseholdProfile(baseTier, 'family', 2);
    expect(r.groceries_monthly).toBeGreaterThan(baseTier.groceries_monthly);
    expect(r.healthcare_monthly).toBeGreaterThan(baseTier.healthcare_monthly);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/household.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/calc/household.ts`**

```ts
// lib/calc/household.ts
import type { TierCosts, HouseholdProfile } from './types';

/**
 * Scale/zero out category values based on household composition.
 * Tier values are curated for a "couple" baseline; single/family adjust.
 */
export function applyHouseholdProfile(
  tier: TierCosts,
  profile: HouseholdProfile,
  kidsCount: number
): TierCosts {
  const r: TierCosts = { ...tier };
  if (profile === 'single') {
    r.education_annual = 0;
    r.groceries_monthly = tier.groceries_monthly * 0.6;
    r.healthcare_monthly = tier.healthcare_monthly * 0.55;
    r.domestic_help_monthly = tier.domestic_help_monthly * 0.5;
    r.travel_annual = tier.travel_annual * 0.7;
  } else if (profile === 'couple') {
    r.education_annual = 0; // couple = no kids in this app's model
  } else if (profile === 'family') {
    const k = Math.max(1, kidsCount);
    r.education_annual = tier.education_annual * k;
    r.groceries_monthly = tier.groceries_monthly * (1 + k * 0.35);
    r.healthcare_monthly = tier.healthcare_monthly * (1 + k * 0.4);
    r.travel_annual = tier.travel_annual * (1 + k * 0.25);
  }
  return r;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/household.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/household.ts lib/calc/household.test.ts
git commit -m "feat(calc): household profile application"
```

---

### Task 14: Annual spend aggregator

**Files:**
- Create: `lib/calc/spend.ts`
- Create: `lib/calc/spend.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/spend.test.ts
import { describe, it, expect } from 'vitest';
import { computeAnnualSpend } from './spend';
import type { TierCosts } from './types';

const tier: TierCosts = {
  description: 't',
  groceries_monthly: 10_000,
  dining_out_monthly: 10_000,
  transport_monthly: 5_000,
  healthcare_monthly: 5_000,
  utilities_monthly: 2_000,
  internet_mobile_monthly: 1_000,
  entertainment_monthly: 5_000,
  personal_services_monthly: 3_000,
  domestic_help_monthly: 6_000,
  luxury_misc_monthly: 3_000,
  education_annual: 100_000,
  travel_annual: 120_000,
  legal_tax_compliance_annual: 30_000,
  visa_residency_annual: 10_000,
  contingency_pct: 0.10,
};

describe('computeAnnualSpend', () => {
  it('sums categories and applies contingency', () => {
    // monthly sum = 10+10+5+5+2+1+5+3+6+3 = 50k × 12 = 600k
    // annual sum = 100+120+30+10 = 260k
    // base = 860k; × 1.10 = 946k
    // housing = 0 in this test
    const r = computeAnnualSpend(tier, 0);
    expect(r.base).toBe(860_000);
    expect(r.total).toBeCloseTo(946_000, 0);
  });

  it('includes housing in base before contingency', () => {
    const r = computeAnnualSpend(tier, 100_000);
    expect(r.base).toBe(960_000);
    expect(r.total).toBeCloseTo(1_056_000, 0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/spend.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/calc/spend.ts`**

```ts
// lib/calc/spend.ts
import type { TierCosts } from './types';

export interface AnnualSpendResult {
  base: number;
  total: number; // base * (1 + contingency_pct)
}

/** Given a (household-adjusted) tier and annual housing cost, return total annual spend. */
export function computeAnnualSpend(tier: TierCosts, annualHousing: number): AnnualSpendResult {
  const monthlySum =
    tier.groceries_monthly +
    tier.dining_out_monthly +
    tier.transport_monthly +
    tier.healthcare_monthly +
    tier.utilities_monthly +
    tier.internet_mobile_monthly +
    tier.entertainment_monthly +
    tier.personal_services_monthly +
    tier.domestic_help_monthly +
    tier.luxury_misc_monthly;
  const annualSum =
    tier.education_annual +
    tier.travel_annual +
    tier.legal_tax_compliance_annual +
    tier.visa_residency_annual;
  const base = monthlySum * 12 + annualSum + annualHousing;
  const total = base * (1 + tier.contingency_pct);
  return { base, total };
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/spend.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/spend.ts lib/calc/spend.test.ts
git commit -m "feat(calc): annual spend aggregation with contingency"
```

---

### Task 15: Top-level FIRE number composition

**Files:**
- Create: `lib/calc/fireNumber.ts`
- Create: `lib/calc/fireNumber.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/calc/fireNumber.test.ts
import { describe, it, expect } from 'vitest';
import { computeFireNumber } from './fireNumber';
import type { CityData, CalcInputs } from './types';

const city: CityData = {
  slug: 'tokyo',
  name: 'Tokyo',
  country: 'Japan',
  currency: 'JPY',
  locale: 'ja-JP',
  lastUpdated: '2026-Q1',
  sources: ['a', 'b'],
  fx: { referenceRateUsdPerLocal: 0.0067, asOf: '2026-01-15' },
  housing: {
    rent_1br_central_monthly: 220_000,
    rent_3br_central_monthly: 520_000,
    rent_1br_suburb_monthly: 130_000,
    rent_3br_suburb_monthly: 280_000,
    buy_price_per_sqm_central: 2_100_000,
    buy_price_per_sqm_suburb: 900_000,
    property_tax_annual_pct: 0.014,
    maintenance_annual_pct: 0.010,
  },
  tiers: {
    true_fat_fire: tierStub(200_000, 200_000_000),
    comfortable_expat: tierStub(100_000, 100_000_000),
    luxury_family: tierStub(250_000, 300_000_000),
  },
};

function tierStub(monthlyEach: number, educationAnnual: number) {
  return {
    description: 's',
    groceries_monthly: monthlyEach,
    dining_out_monthly: monthlyEach,
    transport_monthly: monthlyEach,
    healthcare_monthly: monthlyEach,
    utilities_monthly: monthlyEach,
    internet_mobile_monthly: monthlyEach,
    entertainment_monthly: monthlyEach,
    personal_services_monthly: monthlyEach,
    domestic_help_monthly: monthlyEach,
    luxury_misc_monthly: monthlyEach,
    education_annual: educationAnnual,
    travel_annual: 1_000_000,
    legal_tax_compliance_annual: 400_000,
    visa_residency_annual: 150_000,
    contingency_pct: 0.10,
  };
}

const baseInputs: CalcInputs = {
  tier: 'comfortable_expat',
  household: 'couple',
  kidsCount: 0,
  housingMode: 'rent',
  housingArea: 'central',
  housingSize: '1br',
  homeSqm: 0,
  categoryOverrides: {},
  portfolio: { taxablePct: 0.70, traditionalPct: 0.20, rothPct: 0.10, costBasisPct: 0.65 },
  usStateCode: 'NONE',
  swr: 0.0325,
  withdrawalStrategy: 'proportional',
  retirementAge: 45,
  lifeExpectancy: 95,
};

describe('computeFireNumber', () => {
  it('produces a positive FIRE number', () => {
    const r = computeFireNumber(city, baseInputs, 0.0067);
    expect(r.fireNumberUsd).toBeGreaterThan(0);
    expect(r.annualSpendUsd).toBeGreaterThan(0);
    expect(r.grossWithdrawalUsd).toBeGreaterThanOrEqual(r.annualSpendUsd);
  });

  it('own mode adds homeValue to total capital needed', () => {
    const own: CalcInputs = { ...baseInputs, housingMode: 'own', homeSqm: 80 };
    const r = computeFireNumber(city, own, 0.0067);
    expect(r.homeValueUsd).toBeGreaterThan(0);
    expect(r.totalCapitalNeededUsd).toBeCloseTo(r.fireNumberUsd + r.homeValueUsd, 0);
  });

  it('higher tier → higher FIRE number', () => {
    const comfort = computeFireNumber(city, baseInputs, 0.0067);
    const fat = computeFireNumber(city, { ...baseInputs, tier: 'true_fat_fire' }, 0.0067);
    expect(fat.fireNumberUsd).toBeGreaterThan(comfort.fireNumberUsd);
  });

  it('CA resident has higher FIRE number than NONE for same spend', () => {
    const none = computeFireNumber(city, baseInputs, 0.0067);
    const ca = computeFireNumber(city, { ...baseInputs, usStateCode: 'CA' }, 0.0067);
    expect(ca.fireNumberUsd).toBeGreaterThan(none.fireNumberUsd);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/fireNumber.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/calc/fireNumber.ts`**

```ts
// lib/calc/fireNumber.ts
import type { CityData, CalcInputs, CalcResult, TierCosts } from './types';
import { applyHouseholdProfile } from './household';
import { computeHousing } from './housing';
import { computeAnnualSpend } from './spend';
import { solveGrossWithdrawal } from './withdrawal';

/** Apply user overrides on top of a household-adjusted tier. */
function mergeOverrides(tier: TierCosts, overrides: Partial<TierCosts>): TierCosts {
  return { ...tier, ...overrides };
}

/**
 * Compute full FIRE number for a city + inputs. `fxUsdPerLocal` converts local currency to USD
 * (e.g., JPY 0.0067 USD/JPY).
 */
export function computeFireNumber(
  city: CityData,
  inputs: CalcInputs,
  fxUsdPerLocal: number
): CalcResult {
  const warnings: string[] = [];

  // 1. Tier → household-adjusted → user overrides
  const tierBase = city.tiers[inputs.tier];
  const adjusted = applyHouseholdProfile(tierBase, inputs.household, inputs.kidsCount);
  const finalTier = mergeOverrides(adjusted, inputs.categoryOverrides);

  // 2. Housing
  const housing = computeHousing(city.housing, {
    mode: inputs.housingMode,
    area: inputs.housingArea,
    size: inputs.housingSize,
    homeSqm: inputs.homeSqm,
  });

  // 3. Annual spend (local currency)
  const spend = computeAnnualSpend(finalTier, housing.annualHousingLocal);
  const annualSpendUsd = spend.total * fxUsdPerLocal;

  // 4. Gross-up for taxes
  const w = solveGrossWithdrawal({
    netSpendTarget: annualSpendUsd,
    taxablePct: inputs.portfolio.taxablePct,
    traditionalPct: inputs.portfolio.traditionalPct,
    rothPct: inputs.portfolio.rothPct,
    costBasisPct: inputs.portfolio.costBasisPct,
    stateCode: inputs.usStateCode,
    strategy: inputs.withdrawalStrategy,
  });

  // 5. Apply SWR
  const fireNumberUsd = w.gross / inputs.swr;
  const homeValueUsd = housing.homeValueLocal * fxUsdPerLocal;
  const totalCapitalNeededUsd = fireNumberUsd + homeValueUsd;

  // 6. Warnings
  const horizon = inputs.lifeExpectancy - inputs.retirementAge;
  if (inputs.swr >= 0.04 && horizon >= 40) {
    warnings.push(`SWR of ${(inputs.swr * 100).toFixed(1)}% over ${horizon}yr horizon is aggressive; consider 3.25–3.5%.`);
  }
  if (inputs.portfolio.costBasisPct >= 0.95) {
    warnings.push('Very high cost basis assumption — actual taxes may be higher if gains accrue.');
  }

  return {
    annualSpendUsd,
    grossWithdrawalUsd: w.gross,
    taxBreakdown: w.breakdown,
    fireNumberUsd,
    homeValueUsd,
    totalCapitalNeededUsd,
    warnings,
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/calc/fireNumber.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/fireNumber.ts lib/calc/fireNumber.test.ts
git commit -m "feat(calc): top-level FIRE number computation"
```

---

### Task 16: Golden-test fixtures

**Files:**
- Create: `lib/calc/__tests__/golden/scenarios.json`
- Create: `lib/calc/__tests__/golden/golden.test.ts`

- [ ] **Step 1: Create golden scenarios file**

```json
{
  "$comment": "Hand-verified reference scenarios. Update fixtures intentionally only.",
  "scenarios": [
    {
      "name": "Tokyo comfortable_expat, couple, rent 1br central, CA, 70/20/10 @ 65% basis, 3.25% SWR",
      "city": "tokyo",
      "inputs": {
        "tier": "comfortable_expat",
        "household": "couple",
        "kidsCount": 0,
        "housingMode": "rent",
        "housingArea": "central",
        "housingSize": "1br",
        "homeSqm": 0,
        "categoryOverrides": {},
        "portfolio": { "taxablePct": 0.70, "traditionalPct": 0.20, "rothPct": 0.10, "costBasisPct": 0.65 },
        "usStateCode": "CA",
        "swr": 0.0325,
        "withdrawalStrategy": "proportional",
        "retirementAge": 45,
        "lifeExpectancy": 95
      },
      "$expected": "This field is intentionally empty — on first run, test will print the computed result. Copy into 'expected' once reviewed."
    }
  ]
}
```

- [ ] **Step 2: Write golden test runner**

```ts
// lib/calc/__tests__/golden/golden.test.ts
import { describe, it, expect } from 'vitest';
import fixtures from './scenarios.json';
import { computeFireNumber } from '../../fireNumber';
import { loadCity } from '../../cityLoader';

describe('golden scenarios', () => {
  for (const scenario of fixtures.scenarios) {
    it(scenario.name, async () => {
      const city = await loadCity(scenario.city);
      const fx = city.fx.referenceRateUsdPerLocal;
      const result = computeFireNumber(city, scenario.inputs as never, fx);
      // On first run, print for review:
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ scenario: scenario.name, result }, null, 2));
      // @ts-expect-error — expected may not exist yet
      if (scenario.expected) {
        // @ts-expect-error
        expect(result.fireNumberUsd).toBeCloseTo(scenario.expected.fireNumberUsd, -3);
      }
    });
  }
});
```

- [ ] **Step 3: Note — tests pass initially (no `expected` block), but print values for review.**

This task depends on `cityLoader` (Task 17) and Tokyo data (Task 18), so defer running until those exist.

- [ ] **Step 4: Commit the fixture files**

```bash
git add lib/calc/__tests__/golden/
git commit -m "test(calc): add golden scenario harness"
```

---

## Phase 5: City Data & Loader

### Task 17: City data loader

**Files:**
- Create: `lib/calc/cityLoader.ts`
- Create: `lib/calc/cityLoader.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/calc/cityLoader.test.ts
import { describe, it, expect } from 'vitest';
import { loadCity, listCitySlugs } from './cityLoader';

describe('cityLoader', () => {
  it('loads a valid city by slug', async () => {
    const c = await loadCity('tokyo');
    expect(c.slug).toBe('tokyo');
    expect(c.tiers.true_fat_fire).toBeDefined();
  });

  it('throws on unknown slug', async () => {
    await expect(loadCity('atlantis')).rejects.toThrow();
  });

  it('lists all city slugs', async () => {
    const slugs = await listCitySlugs();
    expect(slugs).toContain('tokyo');
    expect(slugs.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/calc/cityLoader.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/calc/cityLoader.ts`**

```ts
// lib/calc/cityLoader.ts
import { CityDataSchema } from './schema';
import type { CityData } from './types';

// Vite/Next.js static JSON imports using dynamic import paths
const cityFiles = import.meta.glob('@/data/cities/*.json', { eager: true }) as Record<
  string,
  { default: unknown }
>;

function slugFromPath(path: string): string {
  const m = path.match(/\/([^/]+)\.json$/);
  return m?.[1] ?? '';
}

export async function listCitySlugs(): Promise<string[]> {
  return Object.keys(cityFiles).map(slugFromPath).filter(Boolean).sort();
}

export async function loadCity(slug: string): Promise<CityData> {
  const entry = Object.entries(cityFiles).find(([p]) => slugFromPath(p) === slug);
  if (!entry) throw new Error(`Unknown city: ${slug}`);
  const parsed = CityDataSchema.parse(entry[1].default);
  return parsed as CityData;
}
```

- [ ] **Step 4: Run test — expect FAIL (no cities yet)**

Run: `npm test -- lib/calc/cityLoader.test.ts`
Expected: FAIL (tokyo.json not found).

This is fine — Task 18 will add Tokyo data. Proceed.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/cityLoader.ts lib/calc/cityLoader.test.ts
git commit -m "feat(calc): add city data loader with Zod validation"
```

---

### Task 18: Tokyo city data file

**Files:**
- Create: `data/cities/tokyo.json`

- [ ] **Step 1: Write Tokyo data (JPY)**

```json
{
  "slug": "tokyo",
  "name": "Tokyo",
  "country": "Japan",
  "currency": "JPY",
  "locale": "ja-JP",
  "lastUpdated": "2026-Q1",
  "sources": [
    "Numbeo Cost of Living 2026-01",
    "Mercer Cost of Living Survey 2025",
    "Japan Statistics Bureau 2025"
  ],
  "fx": {
    "referenceRateUsdPerLocal": 0.0067,
    "asOf": "2026-01-15",
    "note": "USD per JPY, approx 149 JPY = 1 USD"
  },
  "housing": {
    "rent_1br_central_monthly": 220000,
    "rent_3br_central_monthly": 520000,
    "rent_1br_suburb_monthly": 130000,
    "rent_3br_suburb_monthly": 280000,
    "buy_price_per_sqm_central": 2100000,
    "buy_price_per_sqm_suburb": 900000,
    "property_tax_annual_pct": 0.014,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "Uncompromised lifestyle — Azabu/Hiroo, no trade-offs",
      "groceries_monthly": 180000,
      "dining_out_monthly": 400000,
      "transport_monthly": 90000,
      "healthcare_monthly": 120000,
      "utilities_monthly": 35000,
      "internet_mobile_monthly": 18000,
      "entertainment_monthly": 150000,
      "personal_services_monthly": 100000,
      "domestic_help_monthly": 150000,
      "luxury_misc_monthly": 150000,
      "education_annual": 4500000,
      "travel_annual": 3000000,
      "legal_tax_compliance_annual": 800000,
      "visa_residency_annual": 200000,
      "contingency_pct": 0.10
    },
    "comfortable_expat": {
      "description": "Comfortable Shibuya/Meguro apartment, regular dining, moderate travel",
      "groceries_monthly": 95000,
      "dining_out_monthly": 120000,
      "transport_monthly": 25000,
      "healthcare_monthly": 48000,
      "utilities_monthly": 25000,
      "internet_mobile_monthly": 12000,
      "entertainment_monthly": 60000,
      "personal_services_monthly": 35000,
      "domestic_help_monthly": 40000,
      "luxury_misc_monthly": 40000,
      "education_annual": 2500000,
      "travel_annual": 1200000,
      "legal_tax_compliance_annual": 400000,
      "visa_residency_annual": 150000,
      "contingency_pct": 0.10
    },
    "luxury_family": {
      "description": "Family of four — international school, domestic help, premium housing",
      "groceries_monthly": 220000,
      "dining_out_monthly": 250000,
      "transport_monthly": 120000,
      "healthcare_monthly": 180000,
      "utilities_monthly": 45000,
      "internet_mobile_monthly": 25000,
      "entertainment_monthly": 120000,
      "personal_services_monthly": 80000,
      "domestic_help_monthly": 200000,
      "luxury_misc_monthly": 100000,
      "education_annual": 12000000,
      "travel_annual": 2500000,
      "legal_tax_compliance_annual": 800000,
      "visa_residency_annual": 400000,
      "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Verify loader test passes**

Run: `npm test -- lib/calc/cityLoader.test.ts`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add data/cities/tokyo.json
git commit -m "feat(data): Tokyo city data (JPY)"
```

---

### Task 19: Kuala Lumpur city data

**Files:** Create `data/cities/kuala-lumpur.json`

- [ ] **Step 1: Write KL data (MYR)**

```json
{
  "slug": "kuala-lumpur",
  "name": "Kuala Lumpur",
  "country": "Malaysia",
  "currency": "MYR",
  "locale": "ms-MY",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "Mercer 2025", "ExpatFocus Malaysia 2025"],
  "fx": {
    "referenceRateUsdPerLocal": 0.22,
    "asOf": "2026-01-15",
    "note": "approx 4.5 MYR = 1 USD"
  },
  "housing": {
    "rent_1br_central_monthly": 3500,
    "rent_3br_central_monthly": 7500,
    "rent_1br_suburb_monthly": 1800,
    "rent_3br_suburb_monthly": 4000,
    "buy_price_per_sqm_central": 14000,
    "buy_price_per_sqm_suburb": 6500,
    "property_tax_annual_pct": 0.004,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "KLCC/Mont Kiara luxury condo, full-time staff, fine dining",
      "groceries_monthly": 4500,
      "dining_out_monthly": 8000,
      "transport_monthly": 3000,
      "healthcare_monthly": 2500,
      "utilities_monthly": 900,
      "internet_mobile_monthly": 400,
      "entertainment_monthly": 3500,
      "personal_services_monthly": 2500,
      "domestic_help_monthly": 3000,
      "luxury_misc_monthly": 3500,
      "education_annual": 90000,
      "travel_annual": 60000,
      "legal_tax_compliance_annual": 15000,
      "visa_residency_annual": 20000,
      "contingency_pct": 0.10
    },
    "comfortable_expat": {
      "description": "Mont Kiara or Bangsar mid-rise, regular dining, local + intl travel",
      "groceries_monthly": 2500,
      "dining_out_monthly": 2500,
      "transport_monthly": 1200,
      "healthcare_monthly": 1200,
      "utilities_monthly": 600,
      "internet_mobile_monthly": 250,
      "entertainment_monthly": 1500,
      "personal_services_monthly": 800,
      "domestic_help_monthly": 1200,
      "luxury_misc_monthly": 1000,
      "education_annual": 50000,
      "travel_annual": 30000,
      "legal_tax_compliance_annual": 10000,
      "visa_residency_annual": 15000,
      "contingency_pct": 0.10
    },
    "luxury_family": {
      "description": "Family of four — international school, live-in helper, premium housing",
      "groceries_monthly": 5500,
      "dining_out_monthly": 5000,
      "transport_monthly": 3500,
      "healthcare_monthly": 3500,
      "utilities_monthly": 1200,
      "internet_mobile_monthly": 500,
      "entertainment_monthly": 3000,
      "personal_services_monthly": 2000,
      "domestic_help_monthly": 3500,
      "luxury_misc_monthly": 2500,
      "education_annual": 220000,
      "travel_annual": 55000,
      "legal_tax_compliance_annual": 18000,
      "visa_residency_annual": 25000,
      "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/kuala-lumpur.json
git commit -m "feat(data): Kuala Lumpur city data (MYR)"
```

---

### Task 20: Shanghai city data

**Files:** Create `data/cities/shanghai.json`

- [ ] **Step 1: Write Shanghai data (CNY)**

```json
{
  "slug": "shanghai",
  "name": "Shanghai",
  "country": "China",
  "currency": "CNY",
  "locale": "zh-CN",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "Mercer 2025", "China NBS 2025"],
  "fx": { "referenceRateUsdPerLocal": 0.14, "asOf": "2026-01-15", "note": "approx 7.2 CNY = 1 USD" },
  "housing": {
    "rent_1br_central_monthly": 14000,
    "rent_3br_central_monthly": 35000,
    "rent_1br_suburb_monthly": 7000,
    "rent_3br_suburb_monthly": 16000,
    "buy_price_per_sqm_central": 120000,
    "buy_price_per_sqm_suburb": 55000,
    "property_tax_annual_pct": 0.006,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "Former French Concession / Lujiazui luxury, full lifestyle",
      "groceries_monthly": 12000,
      "dining_out_monthly": 25000,
      "transport_monthly": 7000,
      "healthcare_monthly": 8000,
      "utilities_monthly": 1800,
      "internet_mobile_monthly": 600,
      "entertainment_monthly": 10000,
      "personal_services_monthly": 7000,
      "domestic_help_monthly": 10000,
      "luxury_misc_monthly": 10000,
      "education_annual": 300000,
      "travel_annual": 180000,
      "legal_tax_compliance_annual": 40000,
      "visa_residency_annual": 30000,
      "contingency_pct": 0.12
    },
    "comfortable_expat": {
      "description": "Jing'an or Xintiandi mid-tier, regular dining, moderate travel",
      "groceries_monthly": 6000,
      "dining_out_monthly": 8000,
      "transport_monthly": 2500,
      "healthcare_monthly": 3500,
      "utilities_monthly": 1200,
      "internet_mobile_monthly": 400,
      "entertainment_monthly": 4000,
      "personal_services_monthly": 2500,
      "domestic_help_monthly": 4000,
      "luxury_misc_monthly": 3000,
      "education_annual": 180000,
      "travel_annual": 100000,
      "legal_tax_compliance_annual": 25000,
      "visa_residency_annual": 25000,
      "contingency_pct": 0.12
    },
    "luxury_family": {
      "description": "Family of four — international school, ayi, premium compound",
      "groceries_monthly": 14000,
      "dining_out_monthly": 15000,
      "transport_monthly": 8000,
      "healthcare_monthly": 10000,
      "utilities_monthly": 2500,
      "internet_mobile_monthly": 700,
      "entertainment_monthly": 8000,
      "personal_services_monthly": 5000,
      "domestic_help_monthly": 12000,
      "luxury_misc_monthly": 7000,
      "education_annual": 650000,
      "travel_annual": 180000,
      "legal_tax_compliance_annual": 50000,
      "visa_residency_annual": 40000,
      "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/shanghai.json
git commit -m "feat(data): Shanghai city data (CNY)"
```

---

### Task 21: Beijing city data

**Files:** Create `data/cities/beijing.json`

- [ ] **Step 1: Write Beijing data (CNY)** — similar to Shanghai, generally 10-15% lower on housing, comparable on services:

```json
{
  "slug": "beijing",
  "name": "Beijing",
  "country": "China",
  "currency": "CNY",
  "locale": "zh-CN",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "Mercer 2025", "China NBS 2025"],
  "fx": { "referenceRateUsdPerLocal": 0.14, "asOf": "2026-01-15", "note": "approx 7.2 CNY = 1 USD" },
  "housing": {
    "rent_1br_central_monthly": 12000,
    "rent_3br_central_monthly": 30000,
    "rent_1br_suburb_monthly": 6000,
    "rent_3br_suburb_monthly": 14000,
    "buy_price_per_sqm_central": 100000,
    "buy_price_per_sqm_suburb": 48000,
    "property_tax_annual_pct": 0.006,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "Sanlitun / CBD luxury, full lifestyle",
      "groceries_monthly": 11000, "dining_out_monthly": 22000, "transport_monthly": 6500,
      "healthcare_monthly": 8000, "utilities_monthly": 1800, "internet_mobile_monthly": 600,
      "entertainment_monthly": 9000, "personal_services_monthly": 6500, "domestic_help_monthly": 9000,
      "luxury_misc_monthly": 9000, "education_annual": 280000, "travel_annual": 170000,
      "legal_tax_compliance_annual": 40000, "visa_residency_annual": 30000, "contingency_pct": 0.12
    },
    "comfortable_expat": {
      "description": "Chaoyang / Dongcheng mid-tier, regular dining",
      "groceries_monthly": 5500, "dining_out_monthly": 7000, "transport_monthly": 2200,
      "healthcare_monthly": 3500, "utilities_monthly": 1200, "internet_mobile_monthly": 400,
      "entertainment_monthly": 3500, "personal_services_monthly": 2200, "domestic_help_monthly": 3500,
      "luxury_misc_monthly": 2500, "education_annual": 170000, "travel_annual": 95000,
      "legal_tax_compliance_annual": 25000, "visa_residency_annual": 25000, "contingency_pct": 0.12
    },
    "luxury_family": {
      "description": "Family of four — international school, ayi, premium compound",
      "groceries_monthly": 13000, "dining_out_monthly": 13000, "transport_monthly": 7500,
      "healthcare_monthly": 10000, "utilities_monthly": 2500, "internet_mobile_monthly": 700,
      "entertainment_monthly": 7000, "personal_services_monthly": 4500, "domestic_help_monthly": 11000,
      "luxury_misc_monthly": 6000, "education_annual": 620000, "travel_annual": 170000,
      "legal_tax_compliance_annual": 50000, "visa_residency_annual": 40000, "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/beijing.json
git commit -m "feat(data): Beijing city data (CNY)"
```

---

### Task 22: Chengdu city data

**Files:** Create `data/cities/chengdu.json`

- [ ] **Step 1: Write Chengdu data (CNY)** — significantly cheaper than Shanghai/Beijing:

```json
{
  "slug": "chengdu",
  "name": "Chengdu",
  "country": "China",
  "currency": "CNY",
  "locale": "zh-CN",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "China NBS 2025", "ChengduExpat 2025"],
  "fx": { "referenceRateUsdPerLocal": 0.14, "asOf": "2026-01-15" },
  "housing": {
    "rent_1br_central_monthly": 4500,
    "rent_3br_central_monthly": 11000,
    "rent_1br_suburb_monthly": 2500,
    "rent_3br_suburb_monthly": 6000,
    "buy_price_per_sqm_central": 28000,
    "buy_price_per_sqm_suburb": 14000,
    "property_tax_annual_pct": 0.006,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "Jinjiang district luxury, full lifestyle",
      "groceries_monthly": 8000, "dining_out_monthly": 15000, "transport_monthly": 4500,
      "healthcare_monthly": 5500, "utilities_monthly": 1400, "internet_mobile_monthly": 450,
      "entertainment_monthly": 6000, "personal_services_monthly": 4500, "domestic_help_monthly": 6000,
      "luxury_misc_monthly": 6000, "education_annual": 220000, "travel_annual": 130000,
      "legal_tax_compliance_annual": 30000, "visa_residency_annual": 25000, "contingency_pct": 0.12
    },
    "comfortable_expat": {
      "description": "Tongzilin / High-Tech Zone mid-tier",
      "groceries_monthly": 4000, "dining_out_monthly": 4500, "transport_monthly": 1500,
      "healthcare_monthly": 2500, "utilities_monthly": 900, "internet_mobile_monthly": 300,
      "entertainment_monthly": 2500, "personal_services_monthly": 1500, "domestic_help_monthly": 2500,
      "luxury_misc_monthly": 1800, "education_annual": 130000, "travel_annual": 70000,
      "legal_tax_compliance_annual": 20000, "visa_residency_annual": 20000, "contingency_pct": 0.12
    },
    "luxury_family": {
      "description": "Family of four — international school, ayi, villa compound",
      "groceries_monthly": 9000, "dining_out_monthly": 9000, "transport_monthly": 5500,
      "healthcare_monthly": 7000, "utilities_monthly": 1900, "internet_mobile_monthly": 550,
      "entertainment_monthly": 5000, "personal_services_monthly": 3000, "domestic_help_monthly": 8000,
      "luxury_misc_monthly": 4500, "education_annual": 480000, "travel_annual": 130000,
      "legal_tax_compliance_annual": 40000, "visa_residency_annual": 35000, "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/chengdu.json
git commit -m "feat(data): Chengdu city data (CNY)"
```

---

### Task 23: Seattle city data

**Files:** Create `data/cities/seattle.json`

- [ ] **Step 1: Write Seattle data (USD)**

```json
{
  "slug": "seattle",
  "name": "Seattle",
  "country": "United States",
  "currency": "USD",
  "locale": "en-US",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "BLS CPI 2025", "Zillow Rent Index 2025"],
  "fx": { "referenceRateUsdPerLocal": 1.0, "asOf": "2026-01-15" },
  "housing": {
    "rent_1br_central_monthly": 2600,
    "rent_3br_central_monthly": 5200,
    "rent_1br_suburb_monthly": 2000,
    "rent_3br_suburb_monthly": 3600,
    "buy_price_per_sqm_central": 9000,
    "buy_price_per_sqm_suburb": 6000,
    "property_tax_annual_pct": 0.0093,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "Downtown/Belltown luxury high-rise, full lifestyle",
      "groceries_monthly": 1800, "dining_out_monthly": 3500, "transport_monthly": 900,
      "healthcare_monthly": 1800, "utilities_monthly": 300, "internet_mobile_monthly": 200,
      "entertainment_monthly": 1800, "personal_services_monthly": 1200, "domestic_help_monthly": 1500,
      "luxury_misc_monthly": 1800, "education_annual": 45000, "travel_annual": 35000,
      "legal_tax_compliance_annual": 6000, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "comfortable_expat": {
      "description": "Capitol Hill/Fremont mid-tier apartment, regular dining",
      "groceries_monthly": 1000, "dining_out_monthly": 1200, "transport_monthly": 400,
      "healthcare_monthly": 800, "utilities_monthly": 220, "internet_mobile_monthly": 150,
      "entertainment_monthly": 700, "personal_services_monthly": 400, "domestic_help_monthly": 300,
      "luxury_misc_monthly": 500, "education_annual": 25000, "travel_annual": 15000,
      "legal_tax_compliance_annual": 3000, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "luxury_family": {
      "description": "Family of four — private school, house in Mercer Island/Bellevue",
      "groceries_monthly": 2200, "dining_out_monthly": 2500, "transport_monthly": 1400,
      "healthcare_monthly": 2800, "utilities_monthly": 400, "internet_mobile_monthly": 250,
      "entertainment_monthly": 1400, "personal_services_monthly": 800, "domestic_help_monthly": 2500,
      "luxury_misc_monthly": 1200, "education_annual": 90000, "travel_annual": 30000,
      "legal_tax_compliance_annual": 8000, "visa_residency_annual": 0, "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/seattle.json
git commit -m "feat(data): Seattle city data (USD)"
```

---

### Task 24: Vancouver city data

**Files:** Create `data/cities/vancouver.json`

- [ ] **Step 1: Write Vancouver data (CAD)**

```json
{
  "slug": "vancouver",
  "name": "Vancouver",
  "country": "Canada",
  "currency": "CAD",
  "locale": "en-CA",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "Stats Canada 2025", "CMHC Rental Report 2025"],
  "fx": { "referenceRateUsdPerLocal": 0.73, "asOf": "2026-01-15", "note": "approx 1.37 CAD = 1 USD" },
  "housing": {
    "rent_1br_central_monthly": 2900,
    "rent_3br_central_monthly": 6200,
    "rent_1br_suburb_monthly": 2100,
    "rent_3br_suburb_monthly": 4000,
    "buy_price_per_sqm_central": 14000,
    "buy_price_per_sqm_suburb": 8500,
    "property_tax_annual_pct": 0.0028,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "Coal Harbour/Yaletown luxury, full lifestyle",
      "groceries_monthly": 2000, "dining_out_monthly": 3800, "transport_monthly": 1000,
      "healthcare_monthly": 1200, "utilities_monthly": 250, "internet_mobile_monthly": 220,
      "entertainment_monthly": 2000, "personal_services_monthly": 1200, "domestic_help_monthly": 1600,
      "luxury_misc_monthly": 1800, "education_annual": 40000, "travel_annual": 40000,
      "legal_tax_compliance_annual": 6000, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "comfortable_expat": {
      "description": "Kitsilano/Mount Pleasant mid-tier",
      "groceries_monthly": 1100, "dining_out_monthly": 1200, "transport_monthly": 400,
      "healthcare_monthly": 500, "utilities_monthly": 180, "internet_mobile_monthly": 150,
      "entertainment_monthly": 800, "personal_services_monthly": 400, "domestic_help_monthly": 300,
      "luxury_misc_monthly": 500, "education_annual": 20000, "travel_annual": 18000,
      "legal_tax_compliance_annual": 3000, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "luxury_family": {
      "description": "Family of four — West Side house, private school",
      "groceries_monthly": 2500, "dining_out_monthly": 2700, "transport_monthly": 1400,
      "healthcare_monthly": 1800, "utilities_monthly": 350, "internet_mobile_monthly": 250,
      "entertainment_monthly": 1500, "personal_services_monthly": 900, "domestic_help_monthly": 2500,
      "luxury_misc_monthly": 1300, "education_annual": 75000, "travel_annual": 35000,
      "legal_tax_compliance_annual": 8000, "visa_residency_annual": 0, "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/vancouver.json
git commit -m "feat(data): Vancouver city data (CAD)"
```

---

### Task 25: San Francisco city data

**Files:** Create `data/cities/san-francisco.json`

- [ ] **Step 1: Write SF data (USD)**

```json
{
  "slug": "san-francisco",
  "name": "San Francisco",
  "country": "United States",
  "currency": "USD",
  "locale": "en-US",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "BLS CPI 2025", "Zillow Rent Index 2025"],
  "fx": { "referenceRateUsdPerLocal": 1.0, "asOf": "2026-01-15" },
  "housing": {
    "rent_1br_central_monthly": 3600,
    "rent_3br_central_monthly": 7500,
    "rent_1br_suburb_monthly": 2700,
    "rent_3br_suburb_monthly": 5000,
    "buy_price_per_sqm_central": 15000,
    "buy_price_per_sqm_suburb": 10000,
    "property_tax_annual_pct": 0.0119,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "Pacific Heights/Russian Hill luxury, full lifestyle",
      "groceries_monthly": 2200, "dining_out_monthly": 4500, "transport_monthly": 1100,
      "healthcare_monthly": 2200, "utilities_monthly": 320, "internet_mobile_monthly": 220,
      "entertainment_monthly": 2400, "personal_services_monthly": 1500, "domestic_help_monthly": 2000,
      "luxury_misc_monthly": 2200, "education_annual": 55000, "travel_annual": 40000,
      "legal_tax_compliance_annual": 8000, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "comfortable_expat": {
      "description": "Mission/Hayes Valley mid-tier apartment",
      "groceries_monthly": 1200, "dining_out_monthly": 1500, "transport_monthly": 450,
      "healthcare_monthly": 1000, "utilities_monthly": 220, "internet_mobile_monthly": 160,
      "entertainment_monthly": 900, "personal_services_monthly": 500, "domestic_help_monthly": 400,
      "luxury_misc_monthly": 600, "education_annual": 30000, "travel_annual": 18000,
      "legal_tax_compliance_annual": 4000, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "luxury_family": {
      "description": "Family of four — private school, house in Noe Valley/Presidio Heights",
      "groceries_monthly": 2700, "dining_out_monthly": 3000, "transport_monthly": 1600,
      "healthcare_monthly": 3200, "utilities_monthly": 450, "internet_mobile_monthly": 280,
      "entertainment_monthly": 1800, "personal_services_monthly": 1000, "domestic_help_monthly": 3000,
      "luxury_misc_monthly": 1500, "education_annual": 110000, "travel_annual": 35000,
      "legal_tax_compliance_annual": 10000, "visa_residency_annual": 0, "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/san-francisco.json
git commit -m "feat(data): San Francisco city data (USD)"
```

---

### Task 26: New York City data

**Files:** Create `data/cities/new-york.json`

- [ ] **Step 1: Write NYC data (USD)**

```json
{
  "slug": "new-york",
  "name": "New York",
  "country": "United States",
  "currency": "USD",
  "locale": "en-US",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "BLS CPI 2025", "StreetEasy Rent Report 2025"],
  "fx": { "referenceRateUsdPerLocal": 1.0, "asOf": "2026-01-15" },
  "housing": {
    "rent_1br_central_monthly": 4200,
    "rent_3br_central_monthly": 9000,
    "rent_1br_suburb_monthly": 2500,
    "rent_3br_suburb_monthly": 4800,
    "buy_price_per_sqm_central": 18000,
    "buy_price_per_sqm_suburb": 8000,
    "property_tax_annual_pct": 0.012,
    "maintenance_annual_pct": 0.010
  },
  "tiers": {
    "true_fat_fire": {
      "description": "UES/Tribeca/West Village luxury, full lifestyle",
      "groceries_monthly": 2400, "dining_out_monthly": 5500, "transport_monthly": 1000,
      "healthcare_monthly": 2400, "utilities_monthly": 350, "internet_mobile_monthly": 230,
      "entertainment_monthly": 3000, "personal_services_monthly": 1800, "domestic_help_monthly": 2200,
      "luxury_misc_monthly": 2500, "education_annual": 65000, "travel_annual": 45000,
      "legal_tax_compliance_annual": 9000, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "comfortable_expat": {
      "description": "Brooklyn/LIC/UWS mid-tier apartment",
      "groceries_monthly": 1300, "dining_out_monthly": 1800, "transport_monthly": 400,
      "healthcare_monthly": 1100, "utilities_monthly": 250, "internet_mobile_monthly": 170,
      "entertainment_monthly": 1100, "personal_services_monthly": 550, "domestic_help_monthly": 500,
      "luxury_misc_monthly": 700, "education_annual": 35000, "travel_annual": 20000,
      "legal_tax_compliance_annual": 4500, "visa_residency_annual": 0, "contingency_pct": 0.10
    },
    "luxury_family": {
      "description": "Family of four — private school, UES classic 6 or brownstone",
      "groceries_monthly": 2900, "dining_out_monthly": 3500, "transport_monthly": 1500,
      "healthcare_monthly": 3500, "utilities_monthly": 500, "internet_mobile_monthly": 300,
      "entertainment_monthly": 2200, "personal_services_monthly": 1200, "domestic_help_monthly": 3500,
      "luxury_misc_monthly": 1800, "education_annual": 130000, "travel_annual": 40000,
      "legal_tax_compliance_annual": 11000, "visa_residency_annual": 0, "contingency_pct": 0.12
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/cities/new-york.json
git commit -m "feat(data): New York city data (USD)"
```

---

### Task 27: Data validation CI check

**Files:**
- Create: `scripts/validate-city-data.ts`
- Modify: `package.json`

- [ ] **Step 1: Write validation script**

```ts
// scripts/validate-city-data.ts
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { CityDataSchema } from '../lib/calc/schema';

const CITY_DIR = path.join(process.cwd(), 'data', 'cities');
const files = readdirSync(CITY_DIR).filter((f) => f.endsWith('.json'));

let hasError = false;
for (const f of files) {
  const raw = JSON.parse(readFileSync(path.join(CITY_DIR, f), 'utf8'));
  const r = CityDataSchema.safeParse(raw);
  if (!r.success) {
    console.error(`❌ ${f}:`);
    console.error(r.error.format());
    hasError = true;
  } else {
    console.log(`✓ ${f}`);
  }
}
if (hasError) process.exit(1);
console.log(`\n${files.length} city files validated.`);
```

- [ ] **Step 2: Add script to `package.json`**

Add under `"scripts"`:
```json
"validate:data": "tsx scripts/validate-city-data.ts"
```

- [ ] **Step 3: Install tsx**

Run: `npm install -D tsx`

- [ ] **Step 4: Run validation**

Run: `npm run validate:data`
Expected: 9 city files all show `✓`.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-city-data.ts package.json package-lock.json
git commit -m "chore: add city data validation script"
```

---

### Task 28: Populate golden scenario expected values

**Files:** Modify `lib/calc/__tests__/golden/scenarios.json`

- [ ] **Step 1: Run golden test to print computed values**

Run: `npm test -- lib/calc/__tests__/golden/golden.test.ts`
Expected: Test passes (no `expected` set), console prints the computed result.

- [ ] **Step 2: Review the printed output for reasonableness**

Sanity check: for the Tokyo comfortable_expat + CA scenario at 3.25% SWR, the fireNumberUsd should plausibly be in the $3M–$7M range. If the number looks wildly wrong, STOP and debug the calc engine before proceeding.

- [ ] **Step 3: Paste the printed result into the scenario `expected` field**

Edit `lib/calc/__tests__/golden/scenarios.json`:
```json
{
  "scenarios": [
    {
      "name": "...",
      "city": "tokyo",
      "inputs": { ... },
      "expected": {
        "fireNumberUsd": <paste computed value>
      }
    }
  ]
}
```

- [ ] **Step 4: Re-run golden test — expect PASS**

Run: `npm test -- lib/calc/__tests__/golden/golden.test.ts`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add lib/calc/__tests__/golden/scenarios.json
git commit -m "test(calc): lock in Tokyo golden scenario expected value"
```

---

## Phase 6: FX Rates

### Task 29: FX fetcher with fallback

**Files:**
- Create: `lib/fx/fetchRates.ts`
- Create: `lib/fx/fetchRates.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/fx/fetchRates.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUsdRate, clearCache } from './fetchRates';

describe('fetchUsdRate', () => {
  beforeEach(() => {
    clearCache();
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ rates: { JPY: 149.5, CNY: 7.2, CAD: 1.37 } }),
    })) as unknown as typeof fetch;
  });

  it('returns USD per local for known currency', async () => {
    const rate = await fetchUsdRate('JPY', 0.0067);
    expect(rate).toBeCloseTo(1 / 149.5, 5);
  });

  it('returns fallback when fetch fails', async () => {
    global.fetch = vi.fn(async () => ({ ok: false })) as never;
    const rate = await fetchUsdRate('JPY', 0.0067);
    expect(rate).toBe(0.0067);
  });

  it('returns 1.0 for USD', async () => {
    const rate = await fetchUsdRate('USD', 1.0);
    expect(rate).toBe(1.0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/fx/fetchRates.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/fx/fetchRates.ts`**

```ts
// lib/fx/fetchRates.ts
let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000;

export function clearCache() {
  cache = null;
}

async function ensureRates(): Promise<Record<string, number> | null> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache.rates;
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD');
    if (!res.ok) return null;
    const data = (await res.json()) as { rates: Record<string, number> };
    cache = { rates: data.rates, fetchedAt: Date.now() };
    return data.rates;
  } catch {
    return null;
  }
}

/** Returns USD per unit of `localCurrency`. Falls back to `fallback` on any failure. */
export async function fetchUsdRate(
  localCurrency: string,
  fallback: number
): Promise<number> {
  if (localCurrency === 'USD') return 1.0;
  const rates = await ensureRates();
  if (!rates || !(localCurrency in rates)) return fallback;
  const perUsd = rates[localCurrency]!; // local per USD
  return 1 / perUsd;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- lib/fx/fetchRates.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/fx/fetchRates.ts lib/fx/fetchRates.test.ts
git commit -m "feat(fx): live FX fetcher with fallback and caching"
```

---

## Phase 7: UI — Landing Page

### Task 30: Shared layout and styling

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

- [ ] **Step 1: Update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fat FIRE City Calculator',
  description: 'Estimate the portfolio size needed to retire in major global cities at a Fat FIRE lifestyle (US tax resident).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <a href="/" className="text-xl font-semibold">Fat FIRE City Calculator</a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-neutral-500">
          Educational only. Not financial advice. Data sources listed per city.
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(ui): global layout with header and footer"
```

---

### Task 31: City picker on landing page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/CityCard.tsx`

- [ ] **Step 1: Create `components/CityCard.tsx`**

```tsx
// components/CityCard.tsx
import Link from 'next/link';

interface Props {
  slug: string;
  name: string;
  country: string;
}

export function CityCard({ slug, name, country }: Props) {
  return (
    <Link
      href={`/city/${slug}`}
      className="block rounded-lg border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-400 hover:shadow transition"
    >
      <div className="text-lg font-semibold">{name}</div>
      <div className="text-sm text-neutral-500">{country}</div>
    </Link>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**

```tsx
// app/page.tsx
import { listCitySlugs } from '@/lib/calc/cityLoader';
import { loadCity } from '@/lib/calc/cityLoader';
import { CityCard } from '@/components/CityCard';

export default async function Home() {
  const slugs = await listCitySlugs();
  const cities = await Promise.all(slugs.map((s) => loadCity(s)));
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">How much do you need to Fat FIRE?</h1>
        <p className="text-lg text-neutral-600 max-w-2xl">
          Estimate the portfolio size needed to retire in {cities.length} major global cities.
          US tax resident model — federal LTCG + NIIT + state tax across taxable, traditional, and Roth buckets.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Choose a city</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cities.map((c) => (
            <CityCard key={c.slug} slug={c.slug} name={c.name} country={c.country} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Run dev server and verify**

Run: `npm run dev`
Open http://localhost:3000 — expect landing page with 9 city cards.
Stop server.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/CityCard.tsx
git commit -m "feat(ui): landing page with city picker"
```

---

## Phase 8: UI — Calculator Page

### Task 32: Calculator page skeleton + state management

**Files:**
- Create: `app/city/[slug]/page.tsx`
- Create: `app/city/[slug]/CalculatorClient.tsx`
- Create: `lib/calc/defaults.ts`

- [ ] **Step 1: Create `lib/calc/defaults.ts`**

```ts
// lib/calc/defaults.ts
import type { CalcInputs } from './types';

export const DEFAULT_INPUTS: CalcInputs = {
  tier: 'comfortable_expat',
  household: 'couple',
  kidsCount: 0,
  housingMode: 'rent',
  housingArea: 'central',
  housingSize: '1br',
  homeSqm: 80,
  categoryOverrides: {},
  portfolio: { taxablePct: 0.70, traditionalPct: 0.20, rothPct: 0.10, costBasisPct: 0.65 },
  usStateCode: 'NONE',
  swr: 0.0325,
  withdrawalStrategy: 'proportional',
  retirementAge: 45,
  lifeExpectancy: 95,
};
```

- [ ] **Step 2: Create server page `app/city/[slug]/page.tsx`**

```tsx
// app/city/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { loadCity } from '@/lib/calc/cityLoader';
import { CalculatorClient } from './CalculatorClient';

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const city = await loadCity(slug);
    return <CalculatorClient city={city} />;
  } catch {
    notFound();
  }
}
```

- [ ] **Step 3: Create placeholder `CalculatorClient.tsx`**

```tsx
// app/city/[slug]/CalculatorClient.tsx
'use client';
import { useMemo, useState, useEffect } from 'react';
import { computeFireNumber } from '@/lib/calc/fireNumber';
import { fetchUsdRate } from '@/lib/fx/fetchRates';
import { DEFAULT_INPUTS } from '@/lib/calc/defaults';
import type { CityData, CalcInputs } from '@/lib/calc/types';

export function CalculatorClient({ city }: { city: CityData }) {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [fx, setFx] = useState(city.fx.referenceRateUsdPerLocal);

  useEffect(() => {
    fetchUsdRate(city.currency, city.fx.referenceRateUsdPerLocal).then(setFx);
  }, [city.currency, city.fx.referenceRateUsdPerLocal]);

  const result = useMemo(() => computeFireNumber(city, inputs, fx), [city, inputs, fx]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{city.name}</h1>
        <p className="text-neutral-500">{city.country} · {city.currency} · Updated {city.lastUpdated}</p>
      </header>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="text-sm text-neutral-500">Fat FIRE target</div>
        <div className="text-4xl font-bold">${result.fireNumberUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        <div className="text-sm text-neutral-600 mt-2">
          Annual spend: ${result.annualSpendUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} ·
          Gross withdrawal: ${result.grossWithdrawalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} ·
          Tax: ${result.taxBreakdown.totalTax.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
      </div>
      {/* Inputs panel will be added in next task */}
      <pre className="text-xs bg-neutral-100 p-4 rounded">{JSON.stringify(inputs, null, 2)}</pre>
    </div>
  );
}
```

- [ ] **Step 4: Verify in dev server**

Run `npm run dev`, visit http://localhost:3000/city/tokyo — expect Fat FIRE number to render.

- [ ] **Step 5: Commit**

```bash
git add app/city/[slug]/ lib/calc/defaults.ts
git commit -m "feat(ui): calculator page skeleton with live result"
```

---

### Task 33: Input controls — tier, household, state

**Files:**
- Create: `components/inputs/Select.tsx`
- Create: `components/inputs/InputSection.tsx`
- Modify: `app/city/[slug]/CalculatorClient.tsx`

- [ ] **Step 1: Create `components/inputs/Select.tsx`**

```tsx
// components/inputs/Select.tsx
interface Props<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Select<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Create `components/inputs/InputSection.tsx`**

```tsx
// components/inputs/InputSection.tsx
export function InputSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
```

- [ ] **Step 3: Update `CalculatorClient.tsx` with input sections**

Replace placeholder `<pre>` at bottom of `CalculatorClient.tsx` with:

```tsx
import { Select } from '@/components/inputs/Select';
import { InputSection } from '@/components/inputs/InputSection';
import { stateTax } from '@/lib/calc/taxData';
```

And replace the JSX body with:
```tsx
return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-4">
      <header>
        <h1 className="text-3xl font-bold">{city.name}</h1>
        <p className="text-neutral-500">{city.country} · {city.currency} · Updated {city.lastUpdated}</p>
      </header>

      <InputSection title="Lifestyle tier">
        <Select
          label="Tier"
          value={inputs.tier}
          options={[
            { value: 'comfortable_expat', label: 'Comfortable Expat' },
            { value: 'true_fat_fire', label: 'True Fat FIRE' },
            { value: 'luxury_family', label: 'Luxury Family' },
          ]}
          onChange={(v) => setInputs({ ...inputs, tier: v })}
        />
      </InputSection>

      <InputSection title="Household">
        <Select
          label="Profile"
          value={inputs.household}
          options={[
            { value: 'single', label: 'Single' },
            { value: 'couple', label: 'Couple (no kids)' },
            { value: 'family', label: 'Family with kids' },
          ]}
          onChange={(v) => setInputs({ ...inputs, household: v })}
        />
        {inputs.household === 'family' && (
          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-700">Number of kids</span>
            <input
              type="number" min={1} max={6} value={inputs.kidsCount || 2}
              onChange={(e) => setInputs({ ...inputs, kidsCount: Number(e.target.value) })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        )}
      </InputSection>

      <InputSection title="Housing">
        <Select
          label="Mode"
          value={inputs.housingMode}
          options={[{ value: 'rent', label: 'Rent' }, { value: 'own', label: 'Own' }]}
          onChange={(v) => setInputs({ ...inputs, housingMode: v })}
        />
        <Select
          label="Area"
          value={inputs.housingArea}
          options={[{ value: 'central', label: 'Central' }, { value: 'suburb', label: 'Suburb' }]}
          onChange={(v) => setInputs({ ...inputs, housingArea: v })}
        />
        <Select
          label="Size"
          value={inputs.housingSize}
          options={[{ value: '1br', label: '1 BR' }, { value: '3br', label: '3 BR' }]}
          onChange={(v) => setInputs({ ...inputs, housingSize: v })}
        />
        {inputs.housingMode === 'own' && (
          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-700">Home size (sqm)</span>
            <input
              type="number" min={20} max={500} value={inputs.homeSqm}
              onChange={(e) => setInputs({ ...inputs, homeSqm: Number(e.target.value) })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        )}
      </InputSection>

      <InputSection title="Tax residency">
        <Select
          label="US State"
          value={inputs.usStateCode}
          options={Object.entries(stateTax.states).map(([code, s]) => ({
            value: code, label: s.name,
          }))}
          onChange={(v) => setInputs({ ...inputs, usStateCode: v })}
        />
      </InputSection>

      <InputSection title="Return assumptions">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-neutral-700">Safe Withdrawal Rate: {(inputs.swr * 100).toFixed(2)}%</span>
          <input
            type="range" min={0.025} max={0.045} step={0.0025} value={inputs.swr}
            onChange={(e) => setInputs({ ...inputs, swr: Number(e.target.value) })}
            className="w-full"
          />
        </label>
      </InputSection>
    </div>

    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="text-sm text-neutral-500">Fat FIRE target</div>
        <div className="text-4xl font-bold">${result.fireNumberUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        {inputs.housingMode === 'own' && (
          <div className="text-sm text-neutral-600 mt-2">
            + ${result.homeValueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} home value
            = <strong>${result.totalCapitalNeededUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
          </div>
        )}
        <hr className="my-4 border-neutral-200" />
        <dl className="text-sm space-y-1">
          <div className="flex justify-between"><dt className="text-neutral-500">Annual spend</dt><dd>${result.annualSpendUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Gross withdrawal</dt><dd>${result.grossWithdrawalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Federal LTCG</dt><dd>${result.taxBreakdown.federalLtcg.toLocaleString('en-US', { maximumFractionDigits: 0 })}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Federal ordinary</dt><dd>${result.taxBreakdown.federalOrdinary.toLocaleString('en-US', { maximumFractionDigits: 0 })}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">NIIT</dt><dd>${result.taxBreakdown.niit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">State tax</dt><dd>${result.taxBreakdown.stateTax.toLocaleString('en-US', { maximumFractionDigits: 0 })}</dd></div>
        </dl>
        {result.warnings.length > 0 && (
          <div className="mt-4 rounded bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
          </div>
        )}
      </div>
      <div className="text-xs text-neutral-500">
        Sources: {city.sources.join(' · ')}
      </div>
    </aside>
  </div>
);
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`, visit `/city/tokyo`. Change tier, household, state — number should update live.

- [ ] **Step 5: Commit**

```bash
git add components/inputs/ app/city/[slug]/CalculatorClient.tsx
git commit -m "feat(ui): input controls for tier, household, housing, state, SWR"
```

---

### Task 34: Portfolio composition inputs

**Files:** Modify `app/city/[slug]/CalculatorClient.tsx`

- [ ] **Step 1: Add "Portfolio composition" `InputSection` after "Tax residency"**

Add this JSX in `CalculatorClient.tsx` between the "Tax residency" and "Return assumptions" sections:

```tsx
<InputSection title="Portfolio composition">
  <label className="block space-y-1">
    <span className="text-sm font-medium text-neutral-700">
      Taxable: {(inputs.portfolio.taxablePct * 100).toFixed(0)}%
    </span>
    <input
      type="range" min={0} max={1} step={0.05} value={inputs.portfolio.taxablePct}
      onChange={(e) => {
        const t = Number(e.target.value);
        const remaining = 1 - t;
        const tradRatio = inputs.portfolio.traditionalPct / Math.max(inputs.portfolio.traditionalPct + inputs.portfolio.rothPct, 0.0001);
        setInputs({
          ...inputs,
          portfolio: {
            ...inputs.portfolio,
            taxablePct: t,
            traditionalPct: remaining * tradRatio,
            rothPct: remaining * (1 - tradRatio),
          },
        });
      }}
      className="w-full"
    />
  </label>
  <div className="text-xs text-neutral-500">
    Traditional: {(inputs.portfolio.traditionalPct * 100).toFixed(0)}% · Roth: {(inputs.portfolio.rothPct * 100).toFixed(0)}%
  </div>
  <label className="block space-y-1">
    <span className="text-sm font-medium text-neutral-700">
      Traditional: {(inputs.portfolio.traditionalPct * 100).toFixed(0)}%
    </span>
    <input
      type="range" min={0} max={1 - inputs.portfolio.taxablePct} step={0.05}
      value={inputs.portfolio.traditionalPct}
      onChange={(e) => {
        const tr = Number(e.target.value);
        setInputs({
          ...inputs,
          portfolio: {
            ...inputs.portfolio,
            traditionalPct: tr,
            rothPct: Math.max(0, 1 - inputs.portfolio.taxablePct - tr),
          },
        });
      }}
      className="w-full"
    />
  </label>
  <label className="block space-y-1">
    <span className="text-sm font-medium text-neutral-700">
      Cost basis (of taxable): {(inputs.portfolio.costBasisPct * 100).toFixed(0)}%
    </span>
    <input
      type="range" min={0} max={1} step={0.05} value={inputs.portfolio.costBasisPct}
      onChange={(e) => setInputs({
        ...inputs,
        portfolio: { ...inputs.portfolio, costBasisPct: Number(e.target.value) },
      })}
      className="w-full"
    />
  </label>
</InputSection>
```

- [ ] **Step 2: Verify in browser**

Visit `/city/tokyo`, slide portfolio — results update, tax breakdown changes. CA resident with 100% taxable + 0% basis should show high tax.

- [ ] **Step 3: Commit**

```bash
git add app/city/[slug]/CalculatorClient.tsx
git commit -m "feat(ui): portfolio composition inputs (taxable/traditional/roth + cost basis)"
```

---

### Task 35: Spend breakdown chart

**Files:**
- Create: `components/results/SpendChart.tsx`
- Modify: `app/city/[slug]/CalculatorClient.tsx`

- [ ] **Step 1: Create `components/results/SpendChart.tsx`**

```tsx
// components/results/SpendChart.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TierCosts } from '@/lib/calc/types';

interface Props { tier: TierCosts; fxUsdPerLocal: number; annualHousingLocal: number }

export function SpendChart({ tier, fxUsdPerLocal, annualHousingLocal }: Props) {
  const data = [
    { name: 'Housing', value: annualHousingLocal * fxUsdPerLocal },
    { name: 'Groceries', value: tier.groceries_monthly * 12 * fxUsdPerLocal },
    { name: 'Dining', value: tier.dining_out_monthly * 12 * fxUsdPerLocal },
    { name: 'Transport', value: tier.transport_monthly * 12 * fxUsdPerLocal },
    { name: 'Healthcare', value: tier.healthcare_monthly * 12 * fxUsdPerLocal },
    { name: 'Utilities', value: tier.utilities_monthly * 12 * fxUsdPerLocal },
    { name: 'Internet', value: tier.internet_mobile_monthly * 12 * fxUsdPerLocal },
    { name: 'Entertainment', value: tier.entertainment_monthly * 12 * fxUsdPerLocal },
    { name: 'Personal svcs', value: tier.personal_services_monthly * 12 * fxUsdPerLocal },
    { name: 'Domestic help', value: tier.domestic_help_monthly * 12 * fxUsdPerLocal },
    { name: 'Luxury misc', value: tier.luxury_misc_monthly * 12 * fxUsdPerLocal },
    { name: 'Education', value: tier.education_annual * fxUsdPerLocal },
    { name: 'Travel', value: tier.travel_annual * fxUsdPerLocal },
    { name: 'Legal/tax', value: tier.legal_tax_compliance_annual * fxUsdPerLocal },
    { name: 'Visa', value: tier.visa_residency_annual * fxUsdPerLocal },
  ].filter((d) => d.value > 0);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold mb-3">Annual spend by category (USD)</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" width={80} />
          <Tooltip formatter={(v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Render chart in `CalculatorClient.tsx`**

Add import at top of `CalculatorClient.tsx`:
```tsx
import { SpendChart } from '@/components/results/SpendChart';
import { applyHouseholdProfile } from '@/lib/calc/household';
import { computeHousing } from '@/lib/calc/housing';
```

Then compute and render (inside the main content column, before `</div>`):
```tsx
{(() => {
  const adjusted = applyHouseholdProfile(city.tiers[inputs.tier], inputs.household, inputs.kidsCount);
  const housing = computeHousing(city.housing, {
    mode: inputs.housingMode, area: inputs.housingArea, size: inputs.housingSize, homeSqm: inputs.homeSqm,
  });
  return <SpendChart tier={adjusted} fxUsdPerLocal={fx} annualHousingLocal={housing.annualHousingLocal} />;
})()}
```

- [ ] **Step 3: Verify in browser**

Visit `/city/tokyo` — bar chart renders, updates when tier changes.

- [ ] **Step 4: Commit**

```bash
git add components/results/SpendChart.tsx app/city/[slug]/CalculatorClient.tsx
git commit -m "feat(ui): annual spend breakdown bar chart"
```

---

### Task 36: URL query param state persistence

**Files:** Modify `app/city/[slug]/CalculatorClient.tsx`

- [ ] **Step 1: Add URL sync**

In `CalculatorClient.tsx`, add near the top of the component:

```tsx
import { useSearchParams, useRouter } from 'next/navigation';
```

Replace the `useState` for inputs with:
```tsx
const searchParams = useSearchParams();
const router = useRouter();

const initialInputs = useMemo<CalcInputs>(() => {
  const q = searchParams.get('q');
  if (!q) return DEFAULT_INPUTS;
  try {
    return { ...DEFAULT_INPUTS, ...JSON.parse(decodeURIComponent(atob(q))) };
  } catch {
    return DEFAULT_INPUTS;
  }
}, [searchParams]);

const [inputs, setInputs] = useState<CalcInputs>(initialInputs);

useEffect(() => {
  const encoded = btoa(encodeURIComponent(JSON.stringify(inputs)));
  const url = new URL(window.location.href);
  url.searchParams.set('q', encoded);
  window.history.replaceState(null, '', url.toString());
}, [inputs]);
```

- [ ] **Step 2: Verify round-trip**

Visit `/city/tokyo`, change tier to `true_fat_fire`. Copy URL. Open in new tab → same state restored.

- [ ] **Step 3: Commit**

```bash
git add app/city/[slug]/CalculatorClient.tsx
git commit -m "feat(ui): persist calculator inputs to URL query params"
```

---

## Phase 9: Comparison Page

### Task 37: Comparison page

**Files:**
- Create: `app/compare/page.tsx`
- Create: `app/compare/CompareClient.tsx`

- [ ] **Step 1: Create server page**

```tsx
// app/compare/page.tsx
import { CompareClient } from './CompareClient';
import { listCitySlugs, loadCity } from '@/lib/calc/cityLoader';

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ cities?: string }>;
}) {
  const params = await searchParams;
  const slugs = (params.cities ?? '').split(',').filter(Boolean).slice(0, 4);
  const allSlugs = await listCitySlugs();
  const effective = slugs.length > 0 ? slugs : allSlugs.slice(0, 3);
  const cities = await Promise.all(effective.map((s) => loadCity(s)));
  return <CompareClient cities={cities} allSlugs={allSlugs} />;
}
```

- [ ] **Step 2: Create client component**

```tsx
// app/compare/CompareClient.tsx
'use client';
import { useMemo } from 'react';
import { computeFireNumber } from '@/lib/calc/fireNumber';
import { DEFAULT_INPUTS } from '@/lib/calc/defaults';
import type { CityData } from '@/lib/calc/types';

export function CompareClient({ cities, allSlugs: _allSlugs }: { cities: CityData[]; allSlugs: string[] }) {
  const results = useMemo(() => cities.map((c) => ({
    city: c,
    result: computeFireNumber(c, DEFAULT_INPUTS, c.fx.referenceRateUsdPerLocal),
  })), [cities]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Compare cities</h1>
        <p className="text-neutral-500">Comfortable Expat tier, couple, rent 1BR central, NONE state, 3.25% SWR</p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-sm text-neutral-500">
              <th className="py-2 pr-4">City</th>
              <th className="py-2 pr-4">Annual spend</th>
              <th className="py-2 pr-4">Gross withdrawal</th>
              <th className="py-2 pr-4">Total tax</th>
              <th className="py-2 pr-4">FIRE number</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ city, result }) => (
              <tr key={city.slug} className="border-b border-neutral-100">
                <td className="py-3 pr-4 font-medium">{city.name}</td>
                <td className="py-3 pr-4">${result.annualSpendUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="py-3 pr-4">${result.grossWithdrawalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="py-3 pr-4">${result.taxBreakdown.totalTax.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="py-3 pr-4 font-semibold">${result.fireNumberUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Visit `http://localhost:3000/compare?cities=tokyo,kuala-lumpur,shanghai` — table renders 3 rows.

- [ ] **Step 4: Commit**

```bash
git add app/compare/
git commit -m "feat(ui): city comparison page"
```

---

## Phase 10: E2E Tests & Polish

### Task 38: Playwright config

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 2: Add script to `package.json`**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts package.json
git commit -m "chore: configure Playwright"
```

---

### Task 39: E2E test — calculator happy path

**Files:** Create `e2e/calculator.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from '@playwright/test';

test('Tokyo calculator updates on tier change', async ({ page }) => {
  await page.goto('/city/tokyo');
  await expect(page.getByText('Fat FIRE target')).toBeVisible();
  const initial = await page.locator('text=Fat FIRE target').locator('..').locator('.text-4xl').textContent();
  expect(initial).toMatch(/\$\d/);

  // Change to luxury tier
  await page.locator('select').first().selectOption('true_fat_fire');
  const updated = await page.locator('text=Fat FIRE target').locator('..').locator('.text-4xl').textContent();
  expect(updated).not.toBe(initial);
});

test('landing page lists 9 cities', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('a[href^="/city/"]');
  await expect(cards).toHaveCount(9);
});

test('URL query param restores state', async ({ page }) => {
  await page.goto('/city/tokyo');
  await page.locator('select').first().selectOption('true_fat_fire');
  const url = page.url();
  expect(url).toContain('q=');
  await page.goto(url);
  const selected = await page.locator('select').first().inputValue();
  expect(selected).toBe('true_fat_fire');
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/calculator.spec.ts
git commit -m "test(e2e): calculator happy path and URL round-trip"
```

---

### Task 40: Benchmarks doc

**Files:** Create `docs/benchmarks.md`

- [ ] **Step 1: Write benchmarks doc**

Create `docs/benchmarks.md`:

```markdown
# Accuracy Benchmarks

Comparisons of our calculator output against external references on identical inputs.

## Reference: faangfire.com "Enough in San Francisco"
Source: https://www.faangfire.com/p/enough-in-san-francisco-what-about-taxes

Inputs: couple, SF, comfortable_expat tier tweaked to match, 3% SWR, 70/20/10 portfolio, 65% cost basis, CA resident.

| Metric | faangfire | Ours | Delta |
|--------|-----------|------|-------|
| FIRE number | $5.65M | (TBD - fill after launch) | (TBD) |

## Acceptable delta
±10% for cross-calculator comparisons (different assumption engines). ±5% on golden scenarios (our own locked fixtures).

## When to update
Run this benchmark whenever the calc engine or tier data changes. If delta exceeds threshold, investigate before merging.
```

- [ ] **Step 2: Commit**

```bash
git add docs/benchmarks.md
git commit -m "docs: accuracy benchmarks reference"
```

---

### Task 41: Final full test run and sanity check

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: all tests pass, zero failures.

- [ ] **Step 2: Run data validation**

Run: `npm run validate:data`
Expected: all 9 cities `✓`.

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: all E2E tests pass.

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 5: Run linter**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`
Visit in browser:
- http://localhost:3000 — 9 city cards visible
- http://localhost:3000/city/tokyo — calculator renders, changing tier/state updates FIRE number
- http://localhost:3000/city/kuala-lumpur — loads
- http://localhost:3000/compare?cities=tokyo,kuala-lumpur,san-francisco — comparison table renders
- Toggle rent → own → homeValueUsd appears, totalCapitalNeeded shown

- [ ] **Step 7: Commit any fixes from manual test**

If any issues fixed:
```bash
git add -A
git commit -m "fix: issues found during smoke test"
```

---

## Done

At this point you have:
- 9 city data files with 3 tiers each (27 curated lifestyle presets)
- A pure-TS calc engine with unit tests (tax, withdrawal, housing, household, spend, fireNumber)
- A golden-test harness with Tokyo scenario locked in
- Live FX fetching with fallback
- A Next.js frontend with landing, calculator, comparison pages
- URL-shareable state
- Playwright E2E coverage
- Accuracy benchmarks documented
