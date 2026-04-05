import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { CityDataSchema } from "../lib/calc/schema";

function looksLikeIsoCurrency(currency: string) {
  try {
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(1);
    return true;
  } catch {
    return false;
  }
}

function hasSourceYear(source: string) {
  return /\b20\d{2}\b/.test(source);
}

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

  if (!looksLikeIsoCurrency(result.data.currency)) {
    console.error(`ERROR ${file}: invalid ISO 4217 currency ${result.data.currency}`);
    hasError = true;
    continue;
  }

  let fileHasError = false;
  for (const source of result.data.sources) {
    if (!hasSourceYear(source)) {
      console.error(`ERROR ${file}: source is missing a year → ${source}`);
      hasError = true;
      fileHasError = true;
    }
  }
  if (fileHasError) {
    continue;
  }

  for (const [tierName, tier] of Object.entries(result.data.tiers)) {
    if (tier.contingency_pct > 0.25) {
      console.error(`ERROR ${file}: ${tierName} contingency exceeds sanity range`);
      hasError = true;
      continue;
    }
  }

  console.log(`OK ${file}`);
}

if (hasError) {
  process.exit(1);
}

console.log(`Validated ${files.length} city files.`);
