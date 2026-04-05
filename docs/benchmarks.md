# Accuracy Benchmarks

Comparisons of this calculator against external references on aligned assumptions.

## Reference: faangfire.com "Enough in San Francisco"

Source: https://www.faangfire.com/p/enough-in-san-francisco-what-about-taxes

Inputs: couple, San Francisco, Comfortable Expat tier, 3% SWR, 70/20/10 portfolio, 65% cost basis, California resident.

| Metric | faangfire | Ours | Delta |
| --- | --- | --- | --- |
| FIRE number | $5.65M | $5.93M | +4.9% |

Benchmark run details:

- Our run used the committed San Francisco city preset with 2026 federal brackets and California state tax enabled.
- LTCG is stacked on top of ordinary taxable income; NIIT base is capped at `min(gain, MAGI − $200k)`.
- Result snapshot: annual spend `$163,196`, gross withdrawal `$177,849`, FIRE number `$5,928,311`.
- Tax breakdown: federal LTCG `$2,039`, federal ordinary `$2,088`, NIIT `$0`, CA state `$10,526` (total `$14,653`).
- Delta remains inside the ±10% cross-calculator tolerance for differing assumption engines.

## Acceptable delta

- ±10% for cross-calculator comparisons where assumptions differ.
- ±5% on our own golden scenarios.

## When to update

Re-run the benchmark whenever tax assumptions, withdrawal logic, or city data changes. Investigate before merging if the delta exceeds the threshold.
