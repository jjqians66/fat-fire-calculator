import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCity, listCitySlugs } from "@/lib/calc/cityLoader";
import { CalculatorClient } from "./CalculatorClient";

export async function generateStaticParams() {
  const slugs = await listCitySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const city = await loadCity(slug);
    return {
      title: `${city.name} Fat FIRE Calculator`,
      description: `Estimate the portfolio size needed to retire in ${city.name} with a US-resident tax model.`,
    };
  } catch {
    return {};
  }
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const city = await loadCity(slug).catch(() => null);

  if (!city) {
    notFound();
  }

  return (
    <CalculatorClient
      key={`${slug}:${resolvedSearchParams.q ?? ""}`}
      city={city}
      initialQueryState={resolvedSearchParams.q ?? null}
    />
  );
}
