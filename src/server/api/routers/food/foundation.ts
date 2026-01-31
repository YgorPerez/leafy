import { getDuckDBConnection } from "~/server/duckdb";
import {
  type FoodProduct,
  type FoodSearchResult,
  type FoundationFood,
  type Nutriment,
  FoundationFoodSchema,
} from "../food.schema";

// ─────────────────────────────────────────────────────────────────────────────
// Search Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Search foundation foods by description using DuckDB.
 */
export async function searchFoundationFoods(
  query: string,
  limit: number,
): Promise<FoundationFood[]> {
  const connection = await getDuckDBConnection();
  const lowerQuery = query.toLowerCase();

  const reader = await connection.runAndReadAll(
    `
    SELECT
      fd.json_data,
      (CASE
        WHEN fs.lower_description = ? THEN 100
        WHEN fs.lower_description LIKE ? THEN 80
        WHEN fs.lower_description LIKE ? OR fs.lower_description LIKE ? THEN 60
        WHEN fs.lower_description LIKE ? THEN 40
        WHEN lower(fs.category) LIKE ? THEN 20
        ELSE 0
      END) as score
    FROM foundation_search fs
    JOIN foundation_details fd ON fs.fdcId = fd.fdcId
    WHERE score > 0
    ORDER BY score DESC
    LIMIT ?
    `,
    [
      lowerQuery,
      `${lowerQuery}%`,
      `% ${lowerQuery}%`,
      `%${lowerQuery} %`,
      `%${lowerQuery}%`,
      `%${lowerQuery}%`,
      limit,
    ],
  );

  return reader.getRowObjects().map((row) => {
    const rawJson = row.json_data;
    try {
      const jsonData =
        typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
      return FoundationFoodSchema.parse(jsonData);
    } catch (e) {
      console.error("[foundation] Failed to parse food JSON:", e);
      console.error(
        "[foundation] Raw data snippet:",
        String(rawJson).slice(0, 200),
      );
      throw e;
    }
  });
}

/**
 * Get a foundation food by its FDC ID using DuckDB.
 */
export async function getFoundationFoodById(
  fdcId: number,
): Promise<FoundationFood | undefined> {
  const connection = await getDuckDBConnection();
  const reader = await connection.runAndReadAll(
    "SELECT json_data FROM foundation_details WHERE fdcId = ? LIMIT 1",
    [fdcId],
  );

  const rows = reader.getRowObjects();
  if (rows.length === 0) return undefined;

  const row = rows[0]!;
  const rawJson = row.json_data;
  try {
    const jsonData =
      typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
    return FoundationFoodSchema.parse(jsonData);
  } catch (e) {
    console.error("[foundation] Failed to parse food JSON by ID:", e);
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a foundation food to the common search result format.
 */
export function mapFoundationToSearchResult(
  food: FoundationFood,
): FoodSearchResult {
  return {
    code: String(food.fdcId),
    product_name: food.description,
    brands: null,
    categories: food.foodCategory?.description ?? null,
    nutriscore_grade: null,
    scans_n: 0,
    source: "Foundation",
  };
}

/**
 * Map a foundation food nutrient to the common nutriment format.
 */
function mapFoundationNutrientToNutriment(
  nutrient: FoundationFood["foodNutrients"][number],
): Nutriment {
  return {
    name: nutrient.nutrient.name,
    value: nutrient.amount,
    "100g": nutrient.amount,
    serving: null,
    unit: nutrient.nutrient.unitName,
    prepared_value: null,
    prepared_100g: null,
    prepared_serving: null,
    prepared_unit: null,
  };
}

/**
 * Map a foundation food to the full food product format.
 */
export function mapFoundationToProduct(food: FoundationFood): FoodProduct {
  const nutriments: Nutriment[] = food.foodNutrients.map(
    mapFoundationNutrientToNutriment,
  );

  const primaryPortion = food.foodPortions?.[0];
  const servingSize = primaryPortion
    ? `${primaryPortion.amount ?? primaryPortion.value ?? 1} ${primaryPortion.measureUnit.name} (${primaryPortion.gramWeight}g)`
    : null;
  const servingQuantity = primaryPortion?.gramWeight
    ? String(primaryPortion.gramWeight)
    : null;

  return {
    code: String(food.fdcId),
    product_name: [{ lang: "en", text: food.description }],
    brands: null,
    brands_tags: [],
    categories: food.foodCategory?.description ?? null,
    categories_tags: food.foodCategory
      ? [
          `en:${food.foodCategory.description.toLowerCase().replace(/\s+/g, "-")}`,
        ]
      : [],
    categories_properties: null,
    nutriments,
    source: "Foundation",
    completeness: 1,
    created_t: null,
    last_modified_t: null,
    creator: "USDA",
    ecoscore_grade: null,
    ecoscore_score: null,
    nutriscore_grade: null,
    nutriscore_score: null,
    nova_group: null,
    generic_name: food.scientificName
      ? [{ lang: "en", text: food.scientificName }]
      : null,
    ingredients_n: null,
    ingredients_text: null,
    quantity: "100g",
    serving_quantity: servingQuantity,
    serving_size: servingSize,
    stores: null,
    additives_n: 0,
    additives_tags: [],
    allergens_tags: [],
    countries_tags: ["en:united-states"],
    main_countries_tags: ["en:united-states"],
    popularity_key: null,
    scans_n: 0,
    unique_scans_n: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Exports
// ─────────────────────────────────────────────────────────────────────────────

export function clearFoundationCache(): void {
  // No-op
}

export async function getFoundationFoodsCount(): Promise<number> {
  const connection = await getDuckDBConnection();
  const reader = await connection.runAndReadAll(
    "SELECT count(*) as count FROM foundation_search",
  );
  const rows = reader.getRowObjects();
  return Number(rows[0]?.count ?? 0);
}
