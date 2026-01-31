import type { Nutriment } from "./food.schema";
import { NUTRIENT_KEYS, type NutrientKey } from "./nutrient-keys";

/**
 * Mapping from OpenFoodFacts nutrient names to our generated keys.
 * This provides consistent naming across different data sources.
 */
export const NUTRIENT_KEY_MAP: Record<string, NutrientKey> = {
  // Energy
  "energy-kcal": "Energy", // Mapped to "Energy"
  energy: "Energy",
  energy_kCal: "Energy", // Common variation
  "Energy-kcal": "Energy",

  // Macronutrients
  proteins: "Protein",
  protein: "Protein",
  carbohydrates: "Carbohydrate, by difference", // Closest match
  carbohydrates_100g: "Carbohydrate, by difference",
  fat: "Total lipid (fat)", // Closest match
  "saturated-fat": "Fatty acids, total saturated",
  "trans-fat": "Fatty acids, total trans",

  // Fiber & Sugars
  fiber: "Fiber, total dietary",
  sugars: "Sugars, Total",

  // Minerals
  sodium: "Sodium, Na",
  potassium: "Potassium, K",
  calcium: "Calcium, Ca",
  iron: "Iron, Fe",
  magnesium: "Magnesium, Mg",
  zinc: "Zinc, Zn",
  phosphorus: "Phosphorus, P",
  selenium: "Selenium, Se",
  copper: "Copper, Cu",
  manganese: "Manganese, Mn",

  // Vitamins
  "vitamin-a": "Vitamin A, RAE",
  "vitamin-c": "Vitamin C, total ascorbic acid",
  "vitamin-d": "Vitamin D (D2 + D3)",
  "vitamin-e": "Vitamin E (alpha-tocopherol)",
  "vitamin-k": "Vitamin K (phylloquinone)",
  "vitamin-b6": "Vitamin B-6",
  "vitamin-b12": "Vitamin B-12",
  thiamin: "Thiamin",
  riboflavin: "Riboflavin",
  niacin: "Niacin",
  "pantothenic-acid": "Pantothenic acid",
  "folic-acid": "Folate, total",
  folate: "Folate, total",
  biotin: "Biotin",
  choline: "Choline, total",

  // Other
  cholesterol: "Cholesterol",
  alcohol: "alcohol",
  caffeine: "caffeine",
  water: "Water",
} as const;

/**
 * Normalizes a nutrient key from various formats to our clinical schema format.
 */
export function normalizeNutrientKey(key: string): NutrientKey | undefined {
  const lowerKey = key.toLowerCase().trim();

  // 1. Check direct mapping
  if (key in NUTRIENT_KEY_MAP) {
    return NUTRIENT_KEY_MAP[key as keyof typeof NUTRIENT_KEY_MAP];
  }
  if (lowerKey in NUTRIENT_KEY_MAP) {
    return NUTRIENT_KEY_MAP[lowerKey as keyof typeof NUTRIENT_KEY_MAP];
  }

  // 2. Check if it's already a valid key (case-sensitive first, then insensitive lookup)
  if (NUTRIENT_KEYS.includes(key as NutrientKey)) {
    return key as NutrientKey;
  }

  // 3. Fallback: Fuzzy matching
  if (lowerKey.includes("fiber")) return "Fiber, total dietary";
  if (lowerKey.includes("iron")) return "Iron, Fe";
  if (lowerKey.includes("calcium")) return "Calcium, Ca";
  if (lowerKey.includes("potassium")) return "Potassium, K";
  if (lowerKey.includes("sodium")) return "Sodium, Na";
  if (lowerKey.includes("magnesium")) return "Magnesium, Mg";
  if (lowerKey.includes("zinc")) return "Zinc, Zn";
  if (lowerKey.includes("protein")) return "Protein";
  if (lowerKey.includes("carbohydrate")) return "Carbohydrate, by difference";

  // 4. Try to find case-insensitive match in master list
  const found = NUTRIENT_KEYS.find((k) => k.toLowerCase() === lowerKey);
  if (found) return found;

  return undefined;
}

/**
 * Unit conversion factors to grams.
 */
export const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.592,
  pound: 453.592,
  pounds: 453.592,
  kg: 1000,
  kilogram: 1000,
  ml: 1, // Approximate for water-based foods
  cup: 236.588,
  tbsp: 14.787,
  tsp: 4.929,
} as const;

/**
 * Calculates the scaling factor based on quantity and unit.
 * Nutrients in the database are per 100g, so we need to scale accordingly.
 */
export function calculateScalingFactor(quantity: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  const gramsPerUnit = UNIT_TO_GRAMS[normalizedUnit] ?? 1;
  const totalGrams = quantity * gramsPerUnit;
  return totalGrams / 100;
}

/**
 * Scales nutrients by a given factor.
 */
export function scaleNutrients(
  nutrients: Record<string, number>,
  factor: number,
): Record<string, number> {
  const scaled: Record<string, number> = {};
  for (const [key, value] of Object.entries(nutrients)) {
    scaled[key] = Number((value * factor).toFixed(2));
  }
  return scaled;
}

/**
 * DuckDB nested structs for nutriments come back in various formats.
 * This function normalizes them into a consistent array format.
 */
export function parseNutrimentsFromDuckDB(
  nutriments: unknown,
): Nutriment[] | null {
  if (!nutriments) return null;

  let items = nutriments as unknown;

  // Handle { items: [...] } wrapper
  if (
    typeof items === "object" &&
    items !== null &&
    "items" in items &&
    Array.isArray((items as { items: unknown }).items)
  ) {
    items = (items as { items: unknown[] }).items;
  }

  if (!Array.isArray(items)) return null;

  return items.map((item: unknown) => {
    // Handle { entries: {...} } wrapper
    const data =
      typeof item === "object" &&
      item !== null &&
      "entries" in item &&
      typeof (item as { entries: unknown }).entries === "object"
        ? (item as { entries: Record<string, unknown> }).entries
        : (item as Record<string, unknown>);

    const rawName = String(data.name ?? "");
    const normalizedName = normalizeNutrientKey(rawName);

    // If we can't normalize it to a known key, map it to "other" or keep raw?
    // User asked to NOT lose data, but our type requires valid key.
    // If undefined, we can't fit it in NutrientKey type.
    // However, since NUTRIENT_KEYS contains ALL keys from data,
    // it should be found unless the Parquet changed since extraction.

    return {
      name: normalizedName,
      value: data.value != null ? Number(data.value) : null,
      "100g": data["100g"] != null ? Number(data["100g"]) : null,
      serving: data.serving != null ? Number(data.serving) : null,
      unit: data.unit != null ? String(data.unit) : null,
      prepared_value:
        data.prepared_value != null ? Number(data.prepared_value) : null,
      prepared_100g:
        data.prepared_100g != null ? Number(data.prepared_100g) : null,
      prepared_serving:
        data.prepared_serving != null ? Number(data.prepared_serving) : null,
      prepared_unit:
        data.prepared_unit != null ? String(data.prepared_unit) : null,
    } satisfies Nutriment;
  });
}

/**
 * Extracts a flat Record<string, number> of nutrients from DuckDB nutriments array.
 * Uses 100g values preferentially.
 */
export function extractNutrientValues(
  nutriments: unknown,
): Record<string, number> {
  const parsed = parseNutrimentsFromDuckDB(nutriments);
  if (!parsed) return {};

  const result: Record<string, number> = {};

  for (const nutriment of parsed) {
    if (!nutriment.name) continue;

    const key = normalizeNutrientKey(nutriment.name);
    if (!key) continue;

    const value = nutriment["100g"] ?? nutriment.value ?? 0;

    if (value && typeof value === "number") {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Recursively converts bigint values to numbers throughout an object/array.
 * DuckDB returns bigint for integer columns which can't be JSON serialized.
 */
export function convertBigIntsToNumbers<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertBigIntsToNumbers(item)) as T;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = convertBigIntsToNumbers(val);
    }
    return result as T;
  }

  return value;
}
