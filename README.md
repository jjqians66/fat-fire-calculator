# Fat FIRE City Calculator

Public Next.js calculator for estimating the portfolio size a US tax resident needs to retire in nine launch cities using city-specific spending presets plus federal LTCG, NIIT, and state tax modeling.

## Getting Started

Install dependencies, then start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Core routes:

- `/` landing page with launch cities
- `/city/[slug]` calculator
- `/compare?cities=tokyo,kuala-lumpur,san-francisco` comparison page

## Project Structure

```text
app/            App Router pages and layouts
components/     Shared UI for inputs and result panels
data/           City, FX snapshot, and tax JSON
lib/calc/       Pure calculation engine and loaders
lib/fx/         Live FX fetcher with fallback snapshot
e2e/            Playwright browser tests
scripts/        Validation scripts
docs/           Product spec, plan, and benchmark notes
```

## Verification

```bash
npm run lint
npm test
npm run validate:data
npm run build
npm run test:e2e
```

## Data Notes

- City and tax data are committed as JSON for auditability.
- 2026 federal tax values were updated to the current IRS release; state and city values still need a primary-source audit before a public launch.
- FX uses a live USD base feed with per-city fallback rates.

## Learn More

Relevant local docs for this repo:

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`

Project docs:

- [design spec](./docs/superpowers/specs/2026-04-05-fat-fire-calculator-design.md)
- [implementation plan](./docs/superpowers/plans/2026-04-05-fat-fire-calculator.md)
- [benchmarks](./docs/benchmarks.md)
