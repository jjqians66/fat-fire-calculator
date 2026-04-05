let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;

const ttlMs = 24 * 60 * 60 * 1000;
const storageKey = "fat-fire:fx-cache";

export function clearCache() {
  cache = null;
}

function readStorageCache() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { rates: Record<string, number>; fetchedAt: number };
  } catch {
    return null;
  }
}

function writeStorageCache(value: { rates: Record<string, number>; fetchedAt: number }) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

async function ensureRates(): Promise<Record<string, number> | null> {
  if (cache && Date.now() - cache.fetchedAt < ttlMs) {
    return cache.rates;
  }

  const stored = readStorageCache();
  if (stored && Date.now() - stored.fetchedAt < ttlMs) {
    cache = stored;
    return stored.rates;
  }

  try {
    const response = await fetch("https://api.exchangerate.host/latest?base=USD");
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { rates: Record<string, number> };
    cache = { rates: data.rates, fetchedAt: Date.now() };
    writeStorageCache(cache);
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
