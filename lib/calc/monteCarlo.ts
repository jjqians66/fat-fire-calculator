import assumptions from "@/data/assumptions.json";

export interface MonteCarloInput {
  annualSpendUsd: number;
  currentPortfolioUsd: number;
  retirementAge: number;
  lifeExpectancy: number;
  stockAllocationPct: number;
  expectedRealReturn: number;
  trials?: number;
  rng?: () => number;
}

export interface MonteCarloTrajectoryPoint {
  age: number;
  portfolioUsd: number;
}

export interface MonteCarloResult {
  successRate: number;
  successCount: number;
  trials: number;
  years: number;
  annualVolatility: number;
  percentile10EndingPortfolioUsd: number;
  percentile10Trajectory: MonteCarloTrajectoryPoint[];
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function interpolate(start: number, end: number, weight: number) {
  return start + (end - start) * weight;
}

function arithmeticReturnToLognormal(
  expectedReturn: number,
  annualVolatility: number
) {
  const grossMean = Math.max(0.001, 1 + expectedReturn);
  const variance = annualVolatility ** 2;
  const sigmaSquared = Math.log(1 + variance / (grossMean * grossMean));
  const sigma = Math.sqrt(sigmaSquared);
  const mu = Math.log(grossMean) - sigmaSquared / 2;
  return { mu, sigma };
}

function normalSample(rng: () => number) {
  let u = 0;
  let v = 0;

  while (u === 0) {
    u = rng();
  }
  while (v === 0) {
    v = rng();
  }

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentileIndex(length: number, percentile: number) {
  return Math.max(0, Math.min(length - 1, Math.floor((length - 1) * percentile)));
}

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function computePortfolioVolatility(stockAllocationPct: number) {
  const stockWeight = clamp01(stockAllocationPct);
  return interpolate(
    assumptions.monteCarlo.bondVolatility,
    assumptions.monteCarlo.stockVolatility,
    stockWeight
  );
}

export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const years = Math.max(0, input.lifeExpectancy - input.retirementAge);
  const trials = input.trials ?? assumptions.monteCarlo.defaultTrials;
  const rng = input.rng ?? Math.random;
  const annualVolatility = computePortfolioVolatility(input.stockAllocationPct);

  if (years === 0) {
    const endingPortfolio = Math.max(0, input.currentPortfolioUsd);
    return {
      successRate: endingPortfolio > 0 ? 1 : 0,
      successCount: endingPortfolio > 0 ? trials : 0,
      trials,
      years,
      annualVolatility,
      percentile10EndingPortfolioUsd: endingPortfolio,
      percentile10Trajectory: [
        {
          age: input.retirementAge,
          portfolioUsd: endingPortfolio,
        },
      ],
    };
  }

  const { mu, sigma } = arithmeticReturnToLognormal(
    input.expectedRealReturn,
    annualVolatility
  );
  const balancesByYear = Array.from(
    { length: years + 1 },
    () => new Float64Array(trials)
  );
  let successCount = 0;

  for (let trial = 0; trial < trials; trial += 1) {
    let portfolio = Math.max(0, input.currentPortfolioUsd);
    const firstYear = balancesByYear[0];
    if (firstYear) {
      firstYear[trial] = portfolio;
    }

    for (let year = 1; year <= years; year += 1) {
      const yearBalances = balancesByYear[year];
      portfolio = Math.max(0, portfolio - input.annualSpendUsd);
      if (portfolio === 0) {
        if (yearBalances) {
          yearBalances[trial] = 0;
        }
        break;
      }

      const grossReturn = Math.exp(mu + sigma * normalSample(rng));
      portfolio *= grossReturn;
      if (yearBalances) {
        yearBalances[trial] = portfolio;
      }
    }

    const endingBalance = balancesByYear[years]?.[trial] ?? 0;
    if (endingBalance > 0) {
      successCount += 1;
    }
  }

  const percentile10Trajectory = balancesByYear.map((values, index) => {
    const sorted = Array.from(values).sort((a, b) => a - b);
    return {
      age: input.retirementAge + index,
      portfolioUsd: sorted[percentileIndex(sorted.length, 0.1)] ?? 0,
    };
  });

  return {
    successRate: successCount / trials,
    successCount,
    trials,
    years,
    annualVolatility,
    percentile10EndingPortfolioUsd:
      percentile10Trajectory[percentile10Trajectory.length - 1]?.portfolioUsd ?? 0,
    percentile10Trajectory,
  };
}
