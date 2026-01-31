import { FOOD_PARQUET_PATH } from "~/server/duckdb";
import type { FoodSource } from "./food.schema";

/**
 * Food source priority - lower number = higher priority.
 * We prioritize trusted nutritional databases over branded products.
 *
 * Priority Order:
 * 1. NCCDB - Nutrition Coordinating Center (most detailed research data)
 * 2. USDA - United States Department of Agriculture
 * 3. CNF - Canadian Nutrient File (Health Canada)
 * 4. IFCDB - International Food Composition Database
 * 5. Branded - Commercial/branded food products
 * 6. User - User-created custom foods
 */
export const SOURCE_PRIORITY: Record<FoodSource, number> = {
  Foundation: 0, // USDA Foundation Foods (real/whole foods) - highest priority
  NCCDB: 1,
  USDA: 2,
  CNF: 3,
  IFCDB: 4,
  Branded: 5,
  User: 6,
} as const;

/**
 * Whole food category priority - lower number = higher priority.
 * Simplified for performance - focus on the most common patterns.
 */
const WHOLE_FOOD_PATTERNS = [
  { pattern: "Raw", priority: 1 },
  { pattern: "Fresh", priority: 1 },
  { pattern: "Whole", priority: 1 },
  { pattern: "Fruits", priority: 3 },
  { pattern: "Vegetables", priority: 3 },
] as const;

/**
 * Builds the SQL CASE for category ranking.
 * Uses CONTAINS for faster string matching than ILIKE with wildcards.
 */
function buildCategoryRankingSQL(): string {
  const cases = WHOLE_FOOD_PATTERNS.map(
    ({ pattern, priority }) =>
      `WHEN contains(lower(categories), '${pattern.toLowerCase()}') THEN ${priority}`,
  ).join("\n            ");

  return `(CASE
            ${cases}
            ELSE 10
          END)`;
}

/**
 * Builds source detection SQL using contains() for faster matching.
 */
function buildSourceDetectionSQL(): string {
  return `CASE
        WHEN contains(lower(creator), 'nccdb') THEN 'NCCDB'
        WHEN contains(lower(creator), 'usda') THEN 'USDA'
        WHEN contains(lower(creator), 'cnf') THEN 'CNF'
        WHEN contains(lower(creator), 'ifcdb') THEN 'IFCDB'
        ELSE 'Branded'
      END`;
}

/**
 * Builds source priority SQL using contains() for faster matching.
 */
function buildSourcePrioritySQL(): string {
  return `(CASE
        WHEN contains(lower(creator), 'nccdb') THEN 1
        WHEN contains(lower(creator), 'usda') THEN 2
        WHEN contains(lower(creator), 'cnf') THEN 3
        WHEN contains(lower(creator), 'ifcdb') THEN 4
        ELSE 5
      END)`;
}

/**
 * Optimized search query using the pre-computed food_search view.
 * All expensive computations (lowercase, source detection, priority ranking)
 * are already done in the view.
 */
export function buildSearchSQL(): string {
  return `
    SELECT
      code,
      product_name_text as product_name,
      brands,
      categories,
      nutriscore_grade,
      scans_n,
      source
    FROM food_search
    WHERE contains(product_name_lower, lower(?))
       OR contains(brands_lower, lower(?))
    ORDER BY
      source_priority ASC,
      category_priority ASC,
      (CASE WHEN product_name_lower = lower(?) THEN 0 ELSE 1 END) ASC,
      scans_n DESC
    LIMIT ?
  `;
}

/**
 * Optimized getById - direct lookup by code.
 * Only selects fields that are commonly needed.
 */
export function buildGetByIdSQL(): string {
  return `
    SELECT
      code,
      product_name,
      brands,
      brands_tags,
      categories,
      categories_tags,
      categories_properties,
      generic_name,
      ingredients_text,
      ingredients_n,
      quantity,
      serving_quantity,
      serving_size,
      nutriscore_grade,
      nutriscore_score,
      nova_group,
      ecoscore_grade,
      ecoscore_score,
      allergens_tags,
      additives_tags,
      additives_n,
      nutriments,
      countries_tags,
      stores,
      created_t,
      last_modified_t,
      creator,
      scans_n,
      unique_scans_n,
      completeness,
      popularity_key,
      ${buildSourceDetectionSQL()} as source
    FROM "${FOOD_PARQUET_PATH}"
    WHERE code = ?
    LIMIT 1
  `;
}

/**
 * SQL query for fetching nutriments by food code.
 */
export function buildGetNutrimentsSQL(): string {
  return `
    SELECT nutriments
    FROM "${FOOD_PARQUET_PATH}"
    WHERE code = ?
    LIMIT 1
  `;
}
