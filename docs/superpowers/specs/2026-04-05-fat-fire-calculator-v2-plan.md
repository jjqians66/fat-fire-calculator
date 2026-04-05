## Fat FIRE Calculator — V2 Plan

**Date:** 2026-04-05
**Status:** Draft, post-V1 shipping
**V1 live at:** https://fat-fire-calculator-ochre.vercel.app

V1 shipped with 9 cities, US-person tax modeling, deterministic SWR, and editable lifestyle tiers. V2 addresses accuracy gaps uncovered during code review, expands coverage, and adds the one feature users actually ask for: *what's my probability of success?*

---

## Scope

### 1. Accuracy & correctness (high priority)

These are post-V1 findings. Most are not user-visible bugs but they erode the "every number is traceable" claim.

| Item | File | Issue |
| --- | --- | --- |
| Married-filing-jointly brackets | `data/tax/us-federal.json` | Only single-filer brackets shipped. Couples are using wrong brackets — understates available headroom at every threshold. Add `filingStatus` input and MFJ bracket set. |
| Solver divergence telemetry | `lib/calc/withdrawal.ts` | Silently exits at max iterations. Add warning when `|error| ≥ tolerance` after `maxIterations`. |
| CA/NY domicile warning | `lib/calc/fireNumber.ts:84` | Currently fires when user *selects* CA/NY as retirement state. Should fire when user *currently* in CA/NY but retiring elsewhere (which we don't track). Either reword to match current trigger or add a "current state" input. |
| FX provider rotation | `lib/fx/fetchRates.ts` | `exchangerate.host` free tier was discontinued. Replace with `open.er-api.com` or `api.frankfurter.app`. Fallback chain: live primary → live secondary → snapshot. |
| Compare page live FX | `app/compare/CompareClient.tsx:19` | Always uses snapshot. Mirror calculator page's `useEffect(fetchUsdRate)` pattern for consistency. |
| Hydration safety | `app/city/[slug]/CalculatorClient.tsx:163` | localStorage read in `useState` initializer causes server/client mismatch. Move to `useEffect` post-hydration. |
| `lastUpdated` CI freshness check | `scripts/validate-city-data.ts` | Spec requires 12-month freshness enforcement. Add script + CI job that fails if any city file's quarter is >12mo old. |

### 2. Expanded golden scenarios

V1 ships with 1 golden scenario. V2 locks the following to catch tax-math regressions:

- 100% Roth (zero tax expected)
- 100% taxable, 0% cost basis, NY state (high-tax edge case)
- 100% traditional, zero state, testing ordinary-income ladder
- Mixed 70/20/10 @ 65% basis hitting NIIT threshold (validates MAGI stacking)
- Cost-basis sensitivity: same scenario @ 0% / 65% / 100% basis
- Tax-optimal withdrawal strategy vs proportional on identical inputs

Each scenario gets a hand-computed `expected.fireNumberUsd` that locks the math.

### 3. Monte Carlo success probability (flagship V2 feature)

**User-facing framing:** "What's the probability my $X portfolio lasts until age 90?"

**Minimal implementation:**
- Inputs: retirement age, life expectancy, portfolio allocation (stock/bond %), current portfolio
- Assumptions from `data/assumptions.json`: real return (default 5%), stdev (~10% for 60/40), inflation (2.5%)
- Engine: N=10,000 synthetic return paths, log-normal draws, no fat tails, no regime shifts, no correlation modeling
- Withdrawal: annualSpendUsd held constant in real terms, drawn from portfolio at start of each year
- Output: success probability (% of paths ending with portfolio > 0 at life expectancy), 10th-percentile portfolio trajectory

**UI placement:** Secondary "Stress test" panel below the primary FIRE number, collapsed by default. Does NOT replace the SWR result — users are told the SWR result is the "deterministic baseline" and the success % is the "simulated stress test."

**Scope guardrails:**
- No historical backtesting (would need Shiller dataset + CAPE handling)
- No fat-tailed return distributions
- No sequence-of-returns visualization beyond the 10th percentile line
- No glidepath modeling (fixed allocation through retirement)

Calculation engine in `lib/calc/monteCarlo.ts`, pure TS, separate from `fireNumber.ts`. 10k paths × 50 years runs in <100ms in a web worker.

### 4. City expansion

Add next tranche per original spec city list:

**V2 wave (10 cities):** Singapore, Hong Kong, Dubai, London, Los Angeles, Zurich, Bangkok, Taipei, Seoul, Lisbon

Each city requires: 3 tier presets, housing (rent/buy), FX snapshot, ≥2 sources, `lastUpdated` current quarter.

### 5. SEO & discoverability

V1 is labeled "public, SEO-friendly" in the spec but ships minimal metadata.

- Per-city dynamic `generateMetadata` with tailored title/description/OG image
- `app/sitemap.ts` listing all cities
- `app/robots.ts`
- Per-city OG image via `@vercel/og` — "Fat FIRE in {City}: from ${low}M to ${high}M"
- Schema.org `FinancialProduct` markup on city pages
- City landing content (300-500 words per city) covering visa/tax/lifestyle context — separate from the calculator UI

### 6. Data refresh process

Spec open question: *"Data refresh cadence: quarterly PR process — who owns?"*

Answer: automate what's automatable.

- GitHub Action runs monthly: fetches Numbeo + Mercer snapshots into a diff-able format, opens a PR if values drift >10%
- FX snapshot refresh: weekly Action pulls current rates into `data/fx/snapshot.json`, commits directly
- Manual quarterly review: curator owns sanity-check of auto-PRs + `lastUpdated` bump

---

## Non-goals for V2

- User accounts / saved scenarios (still no backend DB)
- Non-US tax residents
- Historical Monte Carlo / Trinity-style backtesting
- Social Security / pension income modeling
- Real estate price forecasting
- Multi-currency portfolio modeling (assumes USD-denominated investments)
- Mobile app (web responsive continues)

---

## Success Criteria

- MFJ brackets ship with toggle; hand-verified MFJ scenario added to golden set
- Monte Carlo panel renders a success % within ±2 percentage points of a reference Python implementation on 5 benchmark inputs
- 10 new cities live with all required fields + sources + freshness checks passing
- SF benchmark delta vs faangfire reference stays within ±5%
- All V1 code review "IMPORTANT" findings closed

---

## Rollout Order

1. MFJ brackets + solver telemetry + FX provider swap (unblocks accuracy claim)
2. Hydration + compare-page FX + `lastUpdated` CI (code-review closeout)
3. Expanded golden scenarios (regression lock before bigger changes)
4. Monte Carlo engine + UI panel (flagship feature)
5. 10 new cities (incremental, low-risk data-only PRs)
6. SEO metadata + OG images + sitemap
7. Data refresh automation

Each item ships as its own PR behind the existing git workflow. No feature flags; V1 users see changes as they land.
