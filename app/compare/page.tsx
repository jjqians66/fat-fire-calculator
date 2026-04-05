import { CompareClient } from "./CompareClient";
import { listCitySlugs, loadCity } from "@/lib/calc/cityLoader";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ cities?: string }>;
}) {
  const params = await searchParams;
  const requested = (params.cities ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 4);
  const allSlugs = await listCitySlugs();
  const effective = requested.length > 0 ? requested : allSlugs.slice(0, 3);
  const cities = await Promise.all(effective.map((slug) => loadCity(slug)));

  return <CompareClient cities={cities} allSlugs={allSlugs} />;
}
