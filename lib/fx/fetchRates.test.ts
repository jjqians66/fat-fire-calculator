import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCache, fetchUsdRate } from "./fetchRates";

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe("fetchUsdRate", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("window", { localStorage: makeStorage() });
    clearCache();
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ rates: { JPY: 149.5, CNY: 7.2, CAD: 1.37 } }),
    })) as unknown as typeof fetch;
  });

  it("returns USD per local for a known currency", async () => {
    const rate = await fetchUsdRate("JPY", 0.0067);
    expect(rate).toBeCloseTo(1 / 149.5, 5);
  });

  it("falls back when fetch fails", async () => {
    global.fetch = vi.fn(async () => ({ ok: false })) as never;
    const rate = await fetchUsdRate("JPY", 0.0067);
    expect(rate).toBe(0.0067);
  });

  it("returns 1.0 for USD", async () => {
    const rate = await fetchUsdRate("USD", 1);
    expect(rate).toBe(1);
  });

  it("reuses a fresh localStorage cache before refetching", async () => {
    const first = await fetchUsdRate("CAD", 0.72);
    expect(first).toBeCloseTo(1 / 1.37, 5);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    clearCache();
    const second = await fetchUsdRate("CAD", 0.72);
    expect(second).toBeCloseTo(1 / 1.37, 5);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
