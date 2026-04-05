import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { CityDataSchema } from "./schema";
import type { CityData } from "./types";

const cityDir = path.join(process.cwd(), "data", "cities");

export async function listCitySlugs(): Promise<string[]> {
  const files = await readdir(cityDir);
  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();
}

export async function loadCity(slug: string): Promise<CityData> {
  const filePath = path.join(cityDir, `${slug}.json`);
  const raw = await readFile(filePath, "utf8").catch(() => null);
  if (!raw) {
    throw new Error(`Unknown city: ${slug}`);
  }

  const parsed = CityDataSchema.parse(JSON.parse(raw));
  return parsed as CityData;
}
