import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Food Sources
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Available food data sources:
 * - NCCDB: Nutrition Coordinating Center Food & Nutrient Database
 * - USDA: United States Department of Agriculture
 * - CNF: Canadian Nutrient File (Health Canada)
 * - IFCDB: International Food Composition Database
 * - Branded: Commercial/branded food products
 * - User: User-created custom foods
 */
export const FOOD_SOURCES = [
  "NCCDB",
  "USDA",
  "CNF",
  "IFCDB",
  "Branded",
  "User",
  "Foundation", // USDA Foundation Foods (real/whole foods)
] as const;

export type FoodSource = (typeof FOOD_SOURCES)[number];

/** Zod schema for food source validation */
export const FoodSourceSchema = z.enum(FOOD_SOURCES);

// ─────────────────────────────────────────────────────────────────────────────
// Data Source Selection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Data source types for food search:
 * - foundation: USDA Foundation Foods (real/whole foods with detailed nutrients)
 * - branded: OpenFoodFacts branded products
 */
export const DATA_SOURCES = ["foundation", "branded"] as const;

export type DataSourceType = (typeof DATA_SOURCES)[number];

/** Zod schema for data source validation */
export const DataSourceSchema = z.enum(DATA_SOURCES);

// ─────────────────────────────────────────────────────────────────────────────
// Base Schemas (Reusable building blocks)
// ─────────────────────────────────────────────────────────────────────────────

/** Nullable and optional string field */
const NullableString = z.string().nullable().optional();

/** Nullable and optional number field with coercion */
const NullableNumber = z.coerce.number().nullable().optional();

/** Nullable and optional string array */
const NullableStringArray = z.array(z.string()).nullable().optional();

/** Timestamp that can be string or number */
const TimestampSchema = z.union([z.string(), z.number()]).nullable().optional();

/** Localized text with language code */
export const LocalizedTextSchema = z.object({
  lang: z.string(),
  text: z.string(),
});

/** Array of localized text entries */
const LocalizedTextArraySchema = z
  .array(LocalizedTextSchema)
  .nullable()
  .optional();

// ─────────────────────────────────────────────────────────────────────────────
// Nutriment Schema
// ─────────────────────────────────────────────────────────────────────────────

export const NutrimentSchema = z.object({
  name: NullableString,
  value: NullableNumber,
  "100g": NullableNumber,
  serving: NullableNumber,
  unit: NullableString,
  prepared_value: NullableNumber,
  prepared_100g: NullableNumber,
  prepared_serving: NullableNumber,
  prepared_unit: NullableString,
});

// ─────────────────────────────────────────────────────────────────────────────
// Category Properties Schema
// ─────────────────────────────────────────────────────────────────────────────

export const CategoryPropertiesSchema = z
  .object({
    ciqual_food_code: NullableNumber,
    agribalyse_food_code: NullableNumber,
    agribalyse_proxy_food_code: NullableNumber,
    /** CNF food code from Health Canada */
    cnf_food_code: NullableNumber,
    /** IFCDB reference code */
    ifcdb_food_code: NullableNumber,
  })
  .nullable()
  .optional();

// ─────────────────────────────────────────────────────────────────────────────
// Food Product Schema (Full product details)
// ─────────────────────────────────────────────────────────────────────────────

export const FoodProductSchema = z
  .object({
    // Additives & Allergens
    additives_n: NullableNumber,
    additives_tags: NullableStringArray,
    allergens_tags: NullableStringArray,

    // Brand Information
    brands: NullableString,
    brands_tags: NullableStringArray,

    // Categories
    categories: NullableString,
    categories_tags: NullableStringArray,
    categories_properties: CategoryPropertiesSchema,

    // Identification
    code: NullableString,
    completeness: NullableNumber,

    // Geographic Information
    countries_tags: NullableStringArray,
    main_countries_tags: NullableStringArray,

    // Timestamps & Creator
    created_t: TimestampSchema,
    last_modified_t: TimestampSchema,
    creator: NullableString,

    // Scores & Grades
    ecoscore_grade: NullableString,
    ecoscore_score: NullableNumber,
    nutriscore_grade: NullableString,
    nutriscore_score: NullableNumber,
    nova_group: NullableNumber,

    // Product Details
    generic_name: LocalizedTextArraySchema,
    product_name: LocalizedTextArraySchema,
    ingredients_n: NullableNumber,
    ingredients_text: LocalizedTextArraySchema,

    // Serving Information
    quantity: NullableString,
    serving_quantity: NullableString,
    serving_size: NullableString,
    stores: NullableString,

    // Nutrition
    nutriments: z.array(NutrimentSchema).nullable().optional(),

    // Popularity Metrics
    popularity_key: z.union([z.string(), z.number()]).nullable().optional(),
    scans_n: NullableNumber,
    unique_scans_n: NullableNumber,

    // Data Source
    source: FoodSourceSchema.optional(),
  })
  .passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// Search Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const FoodSearchSchema = z.object({
  code: z.string().nullable(),
  product_name: z.string().nullable(),
  brands: z.string().nullable(),
  categories: z.string().nullable(),
  nutriscore_grade: z.string().nullable(),
  scans_n: z.coerce.number().nullable(),
  source: FoodSourceSchema.optional().default("Branded"),
});

export const FoodSearchOutputSchema = z.array(FoodSearchSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Food Logging Schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Input schema for logging foods */
export const LogFoodInputSchema = z.object({
  date: z.string(),
  foodName: z.string(),
  foodBrand: NullableString,
  foodCode: z.string().optional(),
  source: FoodSourceSchema.optional(),
  dataSource: DataSourceSchema.optional(), // Which database to look up nutrients from
  quantity: z.number(),
  unit: z.string(),
  nutrients: z.record(z.number()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Foundation Food Schemas (USDA Foundation Foods)
// ─────────────────────────────────────────────────────────────────────────────

/** USDA nutrient reference */
export const FoundationNutrientRefSchema = z.object({
  id: z.number(),
  number: z.string(),
  name: z.string(),
  rank: z.number().optional(),
  unitName: z.string(),
});

/** USDA food nutrient derivation source */
export const FoodNutrientSourceSchema = z.object({
  id: z.number().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
});

/** USDA food nutrient derivation */
export const FoodNutrientDerivationSchema = z.object({
  code: z.string().optional(),
  description: z.string().optional(),
  foodNutrientSource: FoodNutrientSourceSchema.optional(),
});

/** USDA food nutrient entry */
export const FoundationFoodNutrientSchema = z.object({
  type: z.string().optional(),
  id: z.number().optional(),
  nutrient: FoundationNutrientRefSchema,
  dataPoints: z.number().optional(),
  foodNutrientDerivation: FoodNutrientDerivationSchema.optional(),
  max: z.number().optional(),
  min: z.number().optional(),
  median: z.number().optional(),
  amount: z.number().optional().default(0),
});

/** USDA measure unit */
export const MeasureUnitSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  abbreviation: z.string(),
});

/** USDA food portion */
export const FoundationFoodPortionSchema = z.object({
  id: z.number().optional(),
  value: z.number().optional(),
  measureUnit: MeasureUnitSchema,
  modifier: z.string().optional(),
  gramWeight: z.number(),
  sequenceNumber: z.number().optional(),
  minYearAcquired: z.number().optional(),
  amount: z.number().optional(),
});

/** USDA food category */
export const FoundationFoodCategorySchema = z.object({
  id: z.number().optional(),
  code: z.string().optional(),
  description: z.string(),
});

/** USDA Foundation Food full schema */
export const FoundationFoodSchema = z.object({
  foodClass: z.string(),
  description: z.string(),
  foodNutrients: z.array(FoundationFoodNutrientSchema),
  scientificName: z.string().optional(),
  foodAttributes: z.array(z.any()).optional(),
  nutrientConversionFactors: z.array(z.any()).optional(),
  isHistoricalReference: z.boolean().optional(),
  ndbNumber: z.number().optional(),
  fdcId: z.number(),
  dataType: z.string(),
  foodCategory: FoundationFoodCategorySchema.optional(),
  foodPortions: z.array(FoundationFoodPortionSchema).optional(),
  publicationDate: z.string().optional(),
  inputFoods: z.array(z.any()).optional(),
});

/** Search input schema with data source selection */
export const FoodSearchInputSchema = z.object({
  query: z.string(),
  limit: z.number().default(10),
  dataSource: DataSourceSchema,
});

/** Get by ID input schema with data source selection */
export const FoodGetByIdInputSchema = z.object({
  id: z.string(),
  dataSource: DataSourceSchema,
});

// ─────────────────────────────────────────────────────────────────────────────
// Type Exports
// ─────────────────────────────────────────────────────────────────────────────

export type FoodProduct = z.infer<typeof FoodProductSchema>;
export type Nutriment = z.infer<typeof NutrimentSchema>;
export type CategoryProperties = z.infer<typeof CategoryPropertiesSchema>;
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
export type FoodSearchResult = z.infer<typeof FoodSearchSchema>;
export type LogFoodInput = z.infer<typeof LogFoodInputSchema>;
export type FoundationFood = z.infer<typeof FoundationFoodSchema>;
export type FoundationFoodNutrient = z.infer<
  typeof FoundationFoodNutrientSchema
>;
export type FoundationFoodPortion = z.infer<typeof FoundationFoodPortionSchema>;

/** Nutrient totals returned from daily nutrition aggregation */
export type NutrientTotals = Record<string, number>;
