import type { FoodSource } from "./food.schema";

export const SOURCE_PRIORITY: Record<FoodSource, number> = {
  Foundation: 0,
  NCCDB: 1,
  USDA: 2,
  CNF: 3,
  IFCDB: 4,
  Branded: 5,
  User: 6,
} as const;

/**
 * Build SQL for searching foods.
 * Uses the food_search table which is optimized for quick lookups.
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
      (CASE WHEN product_name_lower = lower(?) THEN 0 ELSE 1 END) ASC,
      scans_n DESC
    LIMIT ?
  `;
}

/**
 * Build SQL for getting full food details by ID.
 * Uses the food_details table which has all product columns.
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
      popularity_key
    FROM food_details
    WHERE code = ?
    LIMIT 1
  `;
}

/**
 * Build SQL for getting just nutriments by ID.
 * Uses the food_details table.
 */
export function buildGetNutrimentsSQL(): string {
  return `
    SELECT nutriments
    FROM food_details
    WHERE code = ?
    LIMIT 1
  `;
}
