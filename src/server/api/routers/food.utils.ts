import type { Nutriment } from "./food.schema";

/**
 * Mapping from OpenFoodFacts nutrient names to our clinical schema keys.
 * This provides consistent naming across different data sources.
 */
export const NUTRIENT_KEY_MAP: Record<string, string> = {
  // Energy
  "energy-kcal": "energy_kcal",
  energy: "energy_kcal",

  // Macronutrients
  proteins: "protein",
  protein: "protein",
  carbohydrates: "carbohydrate",
  carbohydrates_100g: "carbohydrate",
  fat: "fat",
  "saturated-fat": "saturatedFat",
  "trans-fat": "transFat",

  // Fiber & Sugars
  fiber: "fiber",
  sugars: "sugars",

  // Minerals
  sodium: "sodium",
  potassium: "potassium",
  calcium: "calcium",
  iron: "iron",
  magnesium: "magnesium",
  zinc: "zinc",
  phosphorus: "phosphorus",
  selenium: "selenium",
  copper: "copper",
  manganese: "manganese",

  // Vitamins
  "vitamin-a": "vitaminA",
  "vitamin-c": "vitaminC",
  "vitamin-d": "vitaminD",
  "vitamin-e": "vitaminE",
  "vitamin-k": "vitaminK",
  "vitamin-b6": "vitaminB6",
  "vitamin-b12": "vitaminB12",
  thiamin: "thiamin",
  riboflavin: "riboflavin",
  niacin: "niacin",
  "pantothenic-acid": "pantothenicAcid",
  "folic-acid": "folate",
  folate: "folate",
  biotin: "biotin",
  choline: "choline",

  // Other
  cholesterol: "cholesterol",
  alcohol: "alcohol",
  caffeine: "caffeine",
  water: "water",
} as const;

/**
 * Normalizes a nutrient key from various formats to our clinical schema format.
 */
export function normalizeNutrientKey(key: string): string {
  const lowerKey = key.toLowerCase().trim();

  // Direct mapping
  if (NUTRIENT_KEY_MAP[lowerKey]) {
    return NUTRIENT_KEY_MAP[lowerKey];
  }

  // Fuzzy matching for common patterns
  if (lowerKey.includes("fiber")) return "fiber";
  if (lowerKey.includes("iron")) return "iron";
  if (lowerKey.includes("calcium")) return "calcium";
  if (lowerKey.includes("potassium")) return "potassium";
  if (lowerKey.includes("sodium")) return "sodium";
  if (lowerKey.includes("magnesium")) return "magnesium";
  if (lowerKey.includes("zinc")) return "zinc";
  if (lowerKey.includes("protein")) return "protein";
  if (lowerKey.includes("carbohydrate")) return "carbohydrate";

  // Return original key if no mapping found
  return lowerKey;
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

    return {
      name: String(data.name ?? ""),
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
