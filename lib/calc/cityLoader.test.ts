import { describe, expect, it } from "vitest";
import { listCitySlugs, loadCity } from "./cityLoader";

describe("cityLoader", () => {
  it("loads a valid city by slug", async () => {
    const city = await loadCity("tokyo");
    expect(city.slug).toBe("tokyo");
    expect(city.tiers.true_fat_fire).toBeDefined();
  });

  it("throws for an unknown city", async () => {
    await expect(loadCity("atlantis")).rejects.toThrow();
  });

  it("lists all city slugs", async () => {
    const slugs = await listCitySlugs();
    expect(slugs).toContain("tokyo");
    expect(slugs.length).toBeGreaterThanOrEqual(1);
  });
});
