import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { CityDataSchema } from "../lib/calc/schema";

function quarterToDate(value: string): Date {
  const match = value.match(/^(\d{4})-Q([1-4])$/);
  if (!match) {
    throw new Error(`Invalid lastUpdated value: ${value}`);
  }

  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const monthByQuarter = [0, 3, 6, 9];
  return new Date(Date.UTC(year, monthByQuarter[quarter - 1], 1));
}

const cityDir = path.join(process.cwd(), "data", "cities");
const files = readdirSync(cityDir).filter((file) => file.endsWith(".json"));
const now = new Date();
const twelveMonthsAgo = new Date(
  Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())
);

let hasError = false;
for (const file of files) {
  const raw = JSON.parse(readFileSync(path.join(cityDir, file), "utf8"));
  const result = CityDataSchema.safeParse(raw);

  if (!result.success) {
    console.error(`ERROR ${file}`);
    console.error(result.error.format());
    hasError = true;
    continue;
  }

  try {
    const updatedAt = quarterToDate(result.data.lastUpdated);
    if (updatedAt < twelveMonthsAgo) {
      console.error(`ERROR ${file}: lastUpdated is older than 12 months`);
      hasError = true;
      continue;
    }
  } catch (error) {
    console.error(`ERROR ${file}: ${(error as Error).message}`);
    hasError = true;
    continue;
  }

  console.log(`OK ${file}`);
}

if (hasError) {
  process.exit(1);
}

console.log(`Validated ${files.length} city files.`);
