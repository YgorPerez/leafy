import type { FoodProduct, FoodSearchResult, Nutriment } from "./food.schema";
import {
  BASE_CONVERSIONS,
  convertNutrientValue,
  normalizeToCanonicalKey,
  NUTRIENT_REGISTRY,
} from "../lib/nutrients/registry";

/**
 * Calculates the scaling factor based on quantity and unit.
 * Nutrients in the database are per 100g, so we need to scale accordingly.
 */
export function calculateScalingFactor(quantity: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  const gramsPerUnit = BASE_CONVERSIONS[normalizedUnit] ?? 1;
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

interface DuckDBNutrientEntry {
  name?: string;
  value?: number | string | null;
  "100g"?: number | string | null;
  serving?: number | string | null;
  unit?: string | null;
  prepared_value?: number | string | null;
  prepared_100g?: number | string | null;
  prepared_serving?: number | string | null;
  prepared_unit?: string | null;
}

interface DuckDBUSDANutrient {
  nutrient: {
    name: string;
    unitName: string;
  };
  amount?: number | null;
  value?: number | null;
}

/**
 * DuckDB nested structs for nutriments come back in various formats.
 * This function normalizes them into a consistent array format.
 */
export function parseNutrimentsFromDuckDB(
  nutriments: unknown,
): Nutriment[] | null {
  if (!nutriments) return null;

  // Handle { items: [...] } wrapper (OpenFoodFacts format)
  if (
    typeof nutriments === "object" &&
    "items" in nutriments &&
    Array.isArray((nutriments as { items: unknown[] }).items)
  ) {
    const items = (nutriments as { items: unknown[] }).items;
    return items.map((item) => {
      const data =
        typeof item === "object" && item !== null && "entries" in item
          ? ((item as { entries: unknown }).entries as DuckDBNutrientEntry)
          : (item as DuckDBNutrientEntry);

      const rawName = data.name ?? "";
      const normalizedName =
        normalizeToCanonicalKey(rawName) ?? `not_mapped_${rawName}`;

      return {
        name: normalizedName,
        value: data.value != null ? Number(data.value) : null,
        "100g": data["100g"] != null ? Number(data["100g"]) : null,
        serving: data.serving != null ? Number(data.serving) : null,
        unit: data.unit ?? null,
        prepared_value:
          data.prepared_value != null ? Number(data.prepared_value) : null,
        prepared_100g:
          data.prepared_100g != null ? Number(data.prepared_100g) : null,
        prepared_serving:
          data.prepared_serving != null ? Number(data.prepared_serving) : null,
        prepared_unit: data.prepared_unit ?? null,
      } satisfies Nutriment;
    });
  }

  // Handle { foodNutrients: [...] } wrapper (USDA Foundation format)
  if (
    typeof nutriments === "object" &&
    "foodNutrients" in nutriments &&
    Array.isArray((nutriments as { foodNutrients: unknown[] }).foodNutrients)
  ) {
    const foodNutrients = (nutriments as { foodNutrients: unknown[] })
      .foodNutrients;
    return foodNutrients.map((n) => {
      const entry = n as DuckDBUSDANutrient;
      const val = entry.amount ?? entry.value ?? 0;
      return {
        name:
          normalizeToCanonicalKey(entry.nutrient.name) ?? entry.nutrient.name,
        value: val,
        "100g": val,
        serving: null,
        unit: entry.nutrient.unitName,
        prepared_value: null,
        prepared_100g: null,
        prepared_serving: null,
        prepared_unit: null,
      } satisfies Nutriment;
    });
  }

  // Handle direct array format
  if (Array.isArray(nutriments)) {
    return nutriments.map((item: unknown) => {
      const data = item as DuckDBNutrientEntry;
      const rawName = data.name ?? "";
      const normalizedName =
        normalizeToCanonicalKey(rawName) ?? `not_mapped_${rawName}`;

      return {
        name: normalizedName,
        value: data.value != null ? Number(data.value) : null,
        "100g": data["100g"] != null ? Number(data["100g"]) : null,
        serving: data.serving != null ? Number(data.serving) : null,
        unit: data.unit ?? null,
        prepared_value:
          data.prepared_value != null ? Number(data.prepared_value) : null,
        prepared_100g:
          data.prepared_100g != null ? Number(data.prepared_100g) : null,
        prepared_serving:
          data.prepared_serving != null ? Number(data.prepared_serving) : null,
        prepared_unit: data.prepared_unit ?? null,
      } satisfies Nutriment;
    });
  }

  return null;
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

    const key = normalizeToCanonicalKey(nutriment.name);
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

  // Calculate energy from macros using Atwater General Factors.
  // We prioritize calculation from macros for consistency if any macro is present.
  const hasMacros =
    result.protein !== undefined ||
    result.fat !== undefined ||
    result.carbohydrate !== undefined ||
    result.sugar !== undefined ||
    result.starch !== undefined ||
    result.alcohol !== undefined;

  if (hasMacros) {
    const p = result.protein ?? 0;
    const f = result.fat ?? 0;
    const c = result.carbohydrate ?? (result.starch ?? 0) + (result.sugar ?? 0);
    const a = result.alcohol ?? 0;
    const calculated = p * 4 + c * 4 + f * 9 + a * 7;
    result.energy = Number(calculated.toFixed(2));
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
    return value.map((item: unknown) =>
      convertBigIntsToNumbers(item),
    ) as unknown as T;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = convertBigIntsToNumbers(val);
    }
    return result as unknown as T;
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
        name: normalizeToCanonicalKey(name),
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
