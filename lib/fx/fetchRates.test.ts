import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCache, fetchUsdRate } from "./fetchRates";

describe("fetchUsdRate", () => {
  beforeEach(() => {
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
});
