import type { FoodProduct, FoodSearchResult, Nutriment } from "./food.schema";

import {
  convertNutrientValue,
  normalizeToCanonicalKey,
  NUTRIENT_REGISTRY,
  type CanonicalNutrientKey,
} from "~/lib/nutrients/registry";

/**
 * Normalizes a nutrient key from various formats to our clinical schema format.
 */
export function normalizeNutrientKey(
  key: string,
): CanonicalNutrientKey | undefined {
  return normalizeToCanonicalKey(key);
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
    const metadata = key ? NUTRIENT_REGISTRY[key] : null;
    if (!key || !metadata) continue;

    const rawValue = nutriment["100g"] ?? nutriment.value ?? 0;
    const convertedValue = convertNutrientValue(
      Number(rawValue),
      nutriment.unit ?? null,
      metadata.unit,
    );

    if (convertedValue !== null && typeof convertedValue === "number") {
      result[key] = convertedValue;
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

// ─────────────────────────────────────────────────────────────────────────────
// Custom Food Mapping
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomFoodRecord {
  id: string;
  name: string;
  brand: string | null;
}

export interface CustomFoodFullRecord extends CustomFoodRecord {
  nutriments: Record<string, number> | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * Map custom food to full product format
 */
export function mapCustomFoodToProduct(
  food: CustomFoodFullRecord,
): FoodProduct {
  const nutriments: Nutriment[] = food.nutriments
    ? Object.entries(food.nutriments).map(([name, value]) => ({
        name: normalizeNutrientKey(name),
        value: Number(value),
        "100g": Number(value),
        serving: null,
        unit: null,
        prepared_value: null,
        prepared_100g: null,
        prepared_serving: null,
        prepared_unit: null,
      }))
    : [];

  return {
    code: food.id,
    product_name: [{ lang: "en", text: food.name }],
    brands: food.brand,
    nutriments,
    source: "User",
    additives_n: null,
    additives_tags: [],
    allergens_tags: [],
    brands_tags: [],
    categories: "Custom",
    categories_tags: [],
    categories_properties: null,
    completeness: 1,
    countries_tags: [],
    created_t: food.createdAt.getTime() / 1000,
    creator: "User",
    ecoscore_grade: "unknown",
    ecoscore_score: null,
    generic_name: null,
    ingredients_n: null,
    ingredients_text: null,
    last_modified_t: food.updatedAt ? food.updatedAt.getTime() / 1000 : null,
    main_countries_tags: [],
    nutriscore_grade: "unknown",
    nutriscore_score: null,
    quantity: null,
    serving_quantity: null,
    serving_size: null,
    stores: null,
    nova_group: null,
    popularity_key: null,
    scans_n: 0,
    unique_scans_n: 0,
  };
}

/**
 * Map custom food to search result format
 */
export function mapCustomFoodToSearchResult(
  food: CustomFoodRecord,
): FoodSearchResult {
  return {
    code: food.id,
    product_name: food.name,
    brands: food.brand,
    categories: "Custom",
    nutriscore_grade: "unknown",
    scans_n: 0,
    source: "User",
  };
}
