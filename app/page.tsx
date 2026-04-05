import { HomeCityBrowser } from "@/components/HomeCityBrowser";
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

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          <p className="inline-flex rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-neutral-600">
            Public planning tool
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
            Model the capital you need to Fat FIRE across nine high-interest cities.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-neutral-700">
            Compare city-level spending, US federal tax drag, NIIT, and retirement-state assumptions across taxable, traditional, and Roth buckets. The calculator is optimized for US tax residents planning a portfolio-funded retirement.
          </p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <p className="text-sm font-medium text-neutral-500">What it does well</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
            <li>City-by-city cost presets with editable category overrides.</li>
            <li>Federal LTCG, ordinary income, NIIT, and retirement-state tax drag.</li>
            <li>Shareable URLs and comparison mode for side-by-side review.</li>
          </ul>
        </div>
      </section>
      <HomeCityBrowser cities={summaries} />
    </div>
  );
}
