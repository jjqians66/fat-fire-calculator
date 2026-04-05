let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;

const ttlMs = 24 * 60 * 60 * 1000;

export function clearCache() {
  cache = null;
}

async function ensureRates(): Promise<Record<string, number> | null> {
  if (cache && Date.now() - cache.fetchedAt < ttlMs) {
    return cache.rates;
  }

  try {
    const response = await fetch("https://api.exchangerate.host/latest?base=USD");
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { rates: Record<string, number> };
    cache = { rates: data.rates, fetchedAt: Date.now() };
    return data.rates;
  } catch {
    return null;
  }
}

export async function fetchUsdRate(
  localCurrency: string,
  fallback: number
): Promise<number> {
  if (localCurrency === "USD") {
    return 1;
  }

  const rates = await ensureRates();
  if (!rates || !(localCurrency in rates)) {
    return fallback;
  }

  const localPerUsd = rates[localCurrency]!;
  return 1 / localPerUsd;
}
