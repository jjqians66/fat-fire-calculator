import { describe, expect, it } from "vitest";
import { loadCity } from "../../cityLoader";
import { computeFireNumber } from "../../fireNumber";
import fixtures from "./scenarios.json";

describe("golden scenarios", () => {
  for (const scenario of fixtures.scenarios) {
    it(scenario.name, async () => {
      const city = await loadCity(scenario.city);
      const result = computeFireNumber(
        city,
        scenario.inputs as never,
        city.fx.referenceRateUsdPerLocal
      );

      if ("expected" in scenario && scenario.expected) {
        expect(result.fireNumberUsd).toBeCloseTo(
          scenario.expected.fireNumberUsd,
          -3
        );
      } else {
        console.log(JSON.stringify({ scenario: scenario.name, result }, null, 2));
        expect(result.fireNumberUsd).toBeGreaterThan(0);
      }
    });
  }
});
