import fs from "node:fs";
import path from "node:path";
import {
  type FoodProduct,
  type FoodSearchResult,
  type FoundationFood,
  type Nutriment,
  FoundationFoodSchema,
} from "../food.schema";

// ─────────────────────────────────────────────────────────────────────────────
// Foundation Foods Data Store
// ─────────────────────────────────────────────────────────────────────────────

/** Path to the USDA Foundation Foods JSON file */
const FOUNDATION_JSON_PATH = path.join(process.cwd(), "USDA-foundation.json");

/** Cached foundation foods data */
let foundationFoodsCache: FoundationFood[] | null = null;

/** Index for fast lookup by fdcId */
let foundationFoodsIndex: Map<number, FoundationFood> | null = null;

/**
 * Load foundation foods from JSON file.
 * Data is cached in memory for fast subsequent lookups.
 */
export function loadFoundationFoods(): FoundationFood[] {
  if (foundationFoodsCache) {
    return foundationFoodsCache;
  }

  console.log("[foundation] Loading USDA Foundation Foods...");
  const startTime = Date.now();

  const raw = fs.readFileSync(FOUNDATION_JSON_PATH, "utf-8");
  const data = JSON.parse(raw) as { FoundationFoods: unknown[] };

  // Parse and validate each food item
  foundationFoodsCache = data.FoundationFoods.map((item) => {
    const result = FoundationFoodSchema.safeParse(item);
    if (!result.success) {
      console.warn("[foundation] Failed to parse food:", result.error.message);
      return null;
    }
    return result.data;
  }).filter((item): item is FoundationFood => item !== null);

  // Build index for fast lookup
  foundationFoodsIndex = new Map();
  for (const food of foundationFoodsCache) {
    foundationFoodsIndex.set(food.fdcId, food);
  }

  const elapsed = Date.now() - startTime;
  console.log(
    `[foundation] Loaded ${foundationFoodsCache.length} foods in ${elapsed}ms`,
  );

  return foundationFoodsCache;
}

/**
 * Get a foundation food by its FDC ID.
 */
export function getFoundationFoodById(
  fdcId: number,
): FoundationFood | undefined {
  if (!foundationFoodsIndex) {
    loadFoundationFoods();
  }
  return foundationFoodsIndex?.get(fdcId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Search foundation foods by description.
 * Uses case-insensitive substring matching.
 */
export function searchFoundationFoods(
  query: string,
  limit: number,
): FoundationFood[] {
  const foods = loadFoundationFoods();
  const lowerQuery = query.toLowerCase();

  // Score and filter results
  const matches = foods
    .map((food) => {
      const desc = food.description.toLowerCase();
      let score = 0;

      // Exact match gets highest score
      if (desc === lowerQuery) {
        score = 100;
      }
      // Starts with query gets high score
      else if (desc.startsWith(lowerQuery)) {
        score = 80;
      }
      // Contains query as a word boundary gets medium score
      else if (
        desc.includes(` ${lowerQuery}`) ||
        desc.includes(`${lowerQuery} `)
      ) {
        score = 60;
      }
      // Contains query anywhere gets low score
      else if (desc.includes(lowerQuery)) {
        score = 40;
      }
      // Check category as fallback
      else if (
        food.foodCategory?.description.toLowerCase().includes(lowerQuery)
      ) {
        score = 20;
      }

      return { food, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.food);

  return matches;
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
    brands: null, // Foundation foods don't have brands
    categories: food.foodCategory?.description ?? null,
    nutriscore_grade: null, // Not applicable for foundation foods
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
  // Map nutrients
  const nutriments: Nutriment[] = food.foodNutrients.map(
    mapFoundationNutrientToNutriment,
  );

  // Get primary serving info
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

    // Identification
    completeness: 1,

    // Timestamps
    created_t: null,
    last_modified_t: null,
    creator: "USDA",

    // Scores (not applicable for foundation foods)
    ecoscore_grade: null,
    ecoscore_score: null,
    nutriscore_grade: null,
    nutriscore_score: null,
    nova_group: null,

    // Product details
    generic_name: food.scientificName
      ? [{ lang: "en", text: food.scientificName }]
      : null,
    ingredients_n: null,
    ingredients_text: null,

    // Serving information
    quantity: "100g",
    serving_quantity: servingQuantity,
    serving_size: servingSize,
    stores: null,

    // Additional info
    additives_n: 0,
    additives_tags: [],
    allergens_tags: [],
    countries_tags: ["en:united-states"],
    main_countries_tags: ["en:united-states"],

    // Popularity
    popularity_key: null,
    scans_n: 0,
    unique_scans_n: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Exports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clear the foundation foods cache.
 * Useful for testing or when the JSON file is updated.
 */
export function clearFoundationCache(): void {
  foundationFoodsCache = null;
  foundationFoodsIndex = null;
}

/**
 * Get the number of cached foundation foods.
 */
export function getFoundationFoodsCount(): number {
  return foundationFoodsCache?.length ?? 0;
}
