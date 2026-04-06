import { HomeLanding } from "@/components/HomeLanding";
import { loadCity, listCitySlugs } from "@/lib/calc/cityLoader";
import { DEFAULT_INPUTS } from "@/lib/calc/defaults";
import { computeFireNumber } from "@/lib/calc/fireNumber";

export default async function Home() {
  const slugs = await listCitySlugs();
  const cities = await Promise.all(slugs.map((slug) => loadCity(slug)));
  const summaries = cities.map((city) => {
    const baseline = computeFireNumber(
      city,
      DEFAULT_INPUTS,
      city.fx.referenceRateUsdPerLocal
    );
    return {
      slug: city.slug,
      name: city.name,
      country: city.country,
      currency: city.currency,
      lastUpdated: city.lastUpdated,
      baselineFireNumberUsd: baseline.fireNumberUsd,
    };
  });

  return <HomeLanding cities={summaries} />;
}
