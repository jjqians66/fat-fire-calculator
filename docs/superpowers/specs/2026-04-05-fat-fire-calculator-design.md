# Fat FIRE City Calculator — Design Spec

**Date:** 2026-04-05
**Status:** Design approved, ready for implementation plan
**Audience:** Public web users researching Fat FIRE targets across global cities

**V1 scope — 9 cities:** Tokyo, Kuala Lumpur, Shanghai, Beijing, Chengdu, Seattle, Vancouver, San Francisco, New York. Additional cities added incrementally post-launch.

## Purpose

A public, SEO-friendly web calculator that estimates the portfolio size a **US tax resident** needs to retire in select major global cities (Tokyo, Kuala Lumpur, Shanghai, etc.) at a **Fat FIRE** lifestyle. Accuracy is the primary goal: every number in the output must be traceable to a source, and the tax math must reflect realistic US-person treatment (federal LTCG + NIIT + state) across taxable / traditional / Roth buckets.

## Non-goals

- User accounts, saved scenarios, or server-side persistence (v1)
- Non-US tax residents (future extension)
- Monte Carlo or historical backtesting (v1 uses deterministic SWR)
- Real estate price forecasting (home value is a user input)
- Retirement income modeling (Social Security, pensions) — v1 assumes portfolio-only

## Success Criteria

- User can pick any of the 9 launch cities and get a FIRE number in under 30 seconds
- Every cost-of-living number has a tooltip with source + year
- Calculation output within ±5% of a hand-computed reference on a benchmark scenario
- Data freshness: every city file's `lastUpdated` within 12 months (CI-enforced)

---

## 1. Architecture

**Stack:** Next.js 15 (App Router) + TypeScript strict + Tailwind CSS. Deployed to Vercel. No backend database.

**Module layout:**
```
app/
  page.tsx                   # Landing: city picker + intro
  city/[slug]/page.tsx       # Calculator page
  compare/page.tsx           # Multi-city comparison
components/
  inputs/                    # Sliders, toggles, currency inputs
  results/                   # Results panel, breakdown cards, charts
  CityPicker.tsx
data/
  cities/*.json              # ~50 city files
  tax/us-federal.json        # 2026 LTCG, NIIT, ordinary income brackets
  tax/us-states.json         # State-by-state cap gains + ordinary rates
  assumptions.json           # Default SWR, return, inflation, lifestyle tiers
lib/
  calc/                      # Pure calc engine (no React)
    fireNumber.ts
    tax.ts
    housing.ts
    withdrawal.ts
    schema.ts                # Zod schemas for city/tax data
  fx/                        # Live FX fetch + localStorage cache
```

**Rationale for no DB:** curated JSON committed to git makes every cost update an auditable PR. This is load-bearing for the "very accurate" claim — a user can `git blame` any number.

**Invariant:** `lib/calc/` has zero React/DOM/Node-only dependencies → runs in any JS context, unit-testable in isolation, reusable if we later add Monte Carlo or a server API.

---

## 2. Data Model

### City file schema

One file per city under `data/cities/<slug>.json`. Validated via Zod on load and in CI.

Each city defines **three tier presets** as absolute values (not multipliers) because lifestyle costs don't scale linearly across cities — luxury dining in Tokyo is 6x baseline; in KL it's 2x; imported luxury services in Shanghai differ from staffing costs in KL. Per-tier absolute values force the curator to research each city honestly.

```json
{
  "slug": "tokyo",
  "name": "Tokyo",
  "country": "Japan",
  "currency": "JPY",
  "locale": "ja-JP",
  "lastUpdated": "2026-Q1",
  "sources": ["Numbeo 2026-01", "Mercer CoL 2025", "Japan Stat Bureau 2025"],
  "fx": {
    "referenceRateUsdPerLocal": 0.0067,
    "asOf": "2026-01-15",
    "note": "Snapshot; runtime overrides with live FX when available"
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
      "description": "Uncompromised lifestyle — best neighborhoods, no trade-offs",
      "groceries_monthly": 180000,
      "dining_out_monthly": 400000,
      "transport_monthly": 90000,
      "healthcare_monthly": 120000,
      "utilities_monthly": 35000,
      "internet_mobile_monthly": 18000,
      "entertainment_monthly": 150000,
      "personal_services_monthly": 100000,
      "domestic_help_monthly": 150000,
      "education_annual": 4500000,
      "travel_annual": 3000000,
      "luxury_misc_monthly": 150000,
      "legal_tax_compliance_annual": 800000,
      "visa_residency_annual": 200000,
      "contingency_pct": 0.10
    },
    "comfortable_expat": {
      "description": "Mid-tier expat — comfortable apartment, regular dining out, moderate travel",
      "groceries_monthly": 95000,
      "dining_out_monthly": 120000,
      "transport_monthly": 25000,
      "healthcare_monthly": 48000,
      "utilities_monthly": 25000,
      "internet_mobile_monthly": 12000,
      "entertainment_monthly": 60000,
      "personal_services_monthly": 35000,
      "domestic_help_monthly": 40000,
      "education_annual": 2500000,
      "travel_annual": 1200000,
      "luxury_misc_monthly": 40000,
      "legal_tax_compliance_annual": 400000,
      "visa_residency_annual": 150000,
      "contingency_pct": 0.10
    },
    "luxury_family": {
      "description": "Family of four — international schools, domestic help, premium housing",
      "groceries_monthly": 220000,
      "dining_out_monthly": 250000,
      "transport_monthly": 120000,
      "healthcare_monthly": 180000,
      "utilities_monthly": 45000,
      "internet_mobile_monthly": 25000,
      "entertainment_monthly": 120000,
      "personal_services_monthly": 80000,
      "domestic_help_monthly": 200000,
      "education_annual": 12000000,
      "travel_annual": 2500000,
      "luxury_misc_monthly": 100000,
      "legal_tax_compliance_annual": 800000,
      "visa_residency_annual": 400000,
      "contingency_pct": 0.12
    }
  }
}
```

All amounts are in the city's **local currency**. Calc engine converts to USD at the I/O boundary using live FX (with reference `fx.referenceRateUsdPerLocal` as fallback).

**Required categories** (all three tiers must define):
- Monthly: `groceries`, `dining_out`, `transport`, `healthcare`, `utilities`, `internet_mobile`, `entertainment`, `personal_services`, `domestic_help`, `luxury_misc`
- Annual: `education`, `travel`, `legal_tax_compliance`, `visa_residency`
- `contingency_pct` — buffer applied to total annual spend (default 10%)

**Household modifier:** a `householdProfile` input (single / couple / family-with-kids) zeros out or scales categories that don't apply (e.g., single with no kids → education = 0, domestic_help scaled down). This is applied AFTER tier selection, not via a separate multiplier system.

### FX snapshot

Each city file includes a `fx` block with `referenceRateUsdPerLocal`, `asOf` date, and note. Used as fallback when live FX fetch fails and for reproducibility of the `lastUpdated` snapshot. A separate versioned snapshot file `data/fx/snapshot.json` records rates across all currencies at spec update time.

### Tax data

**`data/tax/us-federal.json`** — 2026 brackets for LTCG (0/15/20%), qualified dividends, ordinary income, NIIT (3.8%) with thresholds, standard deduction (single/MFJ).

**`data/tax/us-states.json`** — per-state object with `capGainsRate`, `ordinaryRateTop`, `treatsLTCGAsOrdinary` (bool). Includes zero-tax states (TX/FL/WA/NV/TN/SD/WY/AK/NH).

### Lifestyle tiers

**Three tiers defined per-city** (in each city's file under `tiers.*`) — no global multipliers:

- **`true_fat_fire`** — uncompromised lifestyle, best neighborhoods, no trade-offs
- **`comfortable_expat`** — mid-tier expat lifestyle
- **`luxury_family`** — family of four, international schools, domestic help

User picks a tier as a starting point; individual categories become editable. `data/assumptions.json` holds only global defaults (SWR, returns, inflation) — not lifestyle costs.

**Why per-city absolute values instead of multipliers:** multipliers create nonsense outputs because lifestyle costs don't scale linearly across cities. Luxury dining in Tokyo might be 6x baseline while in KL it's 2x; international school tuition dominates in Shanghai but not Chengdu. Per-city tier presets force the curator to ground every tier in city-specific reality.

### Source requirement

Every city file **must** list ≥2 sources with year. Enforced in CI via schema validation + a lint rule checking `sources.length >= 2`.

---

## 3. Calculation Engine

Pure TypeScript functions in `lib/calc/`. All internal math in today's USD.

### Step 1 — Annual spend from tier + categories

```
tier = chosenTierPreset                 // true_fat_fire | comfortable_expat | luxury_family
base = applyHouseholdProfile(tier)      // zero/scale categories not applicable

monthlySum = Σ(housing, groceries, dining_out, transport, healthcare,
               utilities, internet_mobile, entertainment, personal_services,
               domestic_help, luxury_misc)
annualSum  = Σ(education, travel, legal_tax_compliance, visa_residency)

annualBase  = monthlySum × 12 + annualSum
annualTotal = annualBase × (1 + contingency_pct)
```

Tier preset provides absolute category values; user's per-category overrides then win.

### Step 2 — Housing mode

- **Rent mode:** `housing_monthly = chosen_rent_tier`
- **Own mode:**
  ```
  homeValue = price_per_sqm × sqm
  housing_monthly = homeValue × (property_tax_pct + maintenance_pct) / 12
  ```
  `homeValue` is **added back** to the FIRE target at the end.

### Step 3 — Portfolio buckets

User inputs (with defaults based on faangfire.com reference):
- `taxablePct` (default 70%)
- `traditionalPct` (default 20%)
- `rothPct` (default 10%)
- `costBasisPct` (default 65%, applies to taxable bucket)

### Step 4 — Withdrawal sequencing

Two strategies:
- **Proportional** (default): withdraw from each bucket at its portfolio weight
- **Tax-optimal**: taxable first → traditional → Roth

### Step 5 — Tax solver

Given `targetNetSpend`, find gross withdrawal `W` such that `W − tax(W) ≥ targetNetSpend`.

For each bucket:
- **Taxable**: `taxableGain = gross × (1 − costBasisPct)`; apply LTCG brackets (0/15/20) + NIIT (3.8% above threshold) + state cap gains rate
- **Traditional**: full amount taxed at ordinary income brackets (federal + state) — minus standard deduction
- **Roth**: zero tax (assumes ≥59.5)

Piecewise-linear solver, converges in <10 iterations.

### Step 6 — FIRE number

```
fireNumber = grossAnnualWithdrawal / SWR
totalCapitalNeeded = fireNumber + homeValue   // if owning
```

### Step 7 — Warnings

Surface to user:
- SWR × horizon combos that historically failed (e.g., 4% for 50+ yrs)
- Cost basis assumption — show sensitivity (0% vs user vs 100%)
- State tax residency caveat (must establish domicile to avoid CA/NY exit issues)

### Accuracy stance on local city tax

For US persons abroad, we do **NOT** double-tax investment withdrawals. US taxes apply; foreign tax credit (FTC) typically offsets any local withholding in treaty countries. We surface a "local tax may apply but is creditable" note rather than adding it to the bill.

---

## 4. UI/UX Flow

### Routes

- `/` — landing, city grid + search, value prop
- `/city/[slug]` — single-page calculator with live results
- `/compare?cities=a,b,c` — side-by-side comparison (up to 4 cities)

### Calculator page (3-column desktop, stacked mobile)

**Left — Inputs** (collapsible sections):
1. Household profile: single / couple / family-with-kids (count), retirement age, life expectancy (default 95)
2. Lifestyle tier toggle: **True Fat FIRE** / **Comfortable Expat** / **Luxury Family**
3. Housing: rent vs own, area (central/suburb), size (1BR/2BR/3BR or sqm)
4. Expenses: all tier categories exposed as editable sliders (USD or local currency), including education, domestic help, legal/tax compliance, visa/residency, luxury misc, contingency %
5. Portfolio composition: taxable / traditional / Roth %, cost basis %
6. Tax assumptions: US state of retirement residency (includes "no state tax")
7. Returns: SWR (default 3.25%), real return (default 5%), inflation (2.5%)

**Right — Live results** (sticky):
- Big number: **Fat FIRE target** in USD (local currency below)
- Breakdown: annual spend → gross withdrawal → tax → net
- Housing add-back line (if owning)
- Years to FIRE (if user enters current portfolio + savings rate)
- "Add to comparison" button

**Center — Visualizations:**
- Bar chart: annual spend by category (city baseline vs user-adjusted)
- Stacked bar: gross withdrawal → federal tax / NIIT / state tax / net spend
- Sources footer: city data provenance + `lastUpdated`

### Accuracy affordances

- Every number has hover tooltip with source + year
- Expandable "Why this number?" panel under the big result shows full math derivation
- Warning banners on aggressive assumptions

### Persistence

- URL query params encode all inputs → shareable links
- Optional localStorage recall on return visits
- No user accounts in v1

---

## 5. Testing Strategy

### Unit tests (Vitest) — `lib/calc/`
- Tax solver convergence on 2026 federal brackets
- Multi-bucket withdrawal sequencing (proportional + tax-optimal)
- FIRE number invariants: doubling spend doubles FIRE (at fixed tax rate)
- Housing rent/own math
- Edge cases: 100% Roth, zero taxable, zero state tax
- Cost basis sensitivity (0% / 65% / 100%)

### Golden tests — `lib/calc/__tests__/golden/`
Hand-computed reference scenarios as JSON fixtures. Locks math against regressions.

### Data validation (CI)
- Zod schema on every city file
- `sources.length >= 2` and `lastUpdated` within 12 months
- ISO 4217 currency validation
- Sanity ranges per category (no negatives, no impossibles)

### Integration tests (Playwright) — critical paths only
- Load `/city/tokyo`, change tier, verify result updates
- Rent → Own toggle updates housing + FIRE number
- URL query param round-trip
- Comparison page renders multiple cities

### Accuracy benchmark
`docs/benchmarks.md` — compares output against faangfire.com example and 2-3 public FIRE calcs on identical inputs. Max acceptable delta documented.

### Linting
ESLint + Prettier + TypeScript strict mode.

---

## City List

**V1 launch (9 cities):** Tokyo, Kuala Lumpur, Shanghai, Beijing, Chengdu, Seattle, Vancouver, San Francisco, New York.

**Post-launch additions:** Singapore, Hong Kong, Dubai, London, Los Angeles, Zurich, Geneva, Sydney, Melbourne, Bangkok, Taipei, Seoul, Lisbon, Madrid, Barcelona, Paris, Berlin, Amsterdam, Vienna, Stockholm, Copenhagen, Oslo, Helsinki, Milan, Rome, Athens, Dublin, Toronto, Montreal, Mexico City, Panama City, Buenos Aires, Santiago, Rio de Janeiro, São Paulo, Cape Town, Tel Aviv, Mumbai, Delhi, Denpasar (Bali), Ho Chi Minh City, Manila, Jakarta.

---

## Open Questions (deferred to implementation)

- Chart library: Recharts vs. native SVG (decide during UI build)
- FX provider: exchangerate.host (free) vs. backup provider
- Data refresh cadence: quarterly PR process — who owns?
