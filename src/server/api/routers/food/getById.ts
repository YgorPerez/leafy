import { publicProcedure } from "~/server/api/trpc";
import { getDuckDBConnection } from "~/server/duckdb";
import { buildGetByIdSQL } from "../food.queries";
import {
  FoodGetByIdInputSchema,
  type FoodProduct,
  type Nutriment,
} from "../food.schema";
import {
  convertBigIntsToNumbers,
  parseNutrimentsFromDuckDB,
} from "../food.utils";
import { getFoundationFoodById, mapFoundationToProduct } from "./foundation";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Map custom food to full product format
// ─────────────────────────────────────────────────────────────────────────────

interface CustomFoodFullRecord {
  id: string;
  name: string;
  brand: string | null;
  nutriments: Record<string, number> | null;
  createdAt: Date;
  updatedAt: Date | null;
}

function mapCustomFoodToProduct(food: CustomFoodFullRecord): FoodProduct {
  const nutriments: Nutriment[] = food.nutriments
    ? Object.entries(food.nutriments).map(([name, value]) => ({
        name,
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

// ─────────────────────────────────────────────────────────────────────────────
// Branded Food Lookup (OpenFoodFacts parquet)
// ─────────────────────────────────────────────────────────────────────────────

async function getBrandedFoodById(code: string): Promise<FoodProduct | null> {
  const connection = await getDuckDBConnection();
  const sql = buildGetByIdSQL();

  console.log("[getById] Branded SQL:", sql);
  console.log("[getById] Params:", [code]);

  const reader = await connection.runAndReadAll(sql, [code]);
  const rows = reader.getRowObjects();

  console.log("[getById] Rows found:", rows.length);

  if (rows.length === 0) {
    return null;
  }

  const row = convertBigIntsToNumbers(rows[0] as Record<string, unknown>);
  console.log("[getById] Raw row keys:", Object.keys(row));

  // Parse nutriments from DuckDB format
  const nutriments = parseNutrimentsFromDuckDB(row.nutriments);
  console.log("[getById] Parsed nutriments count:", nutriments?.length ?? 0);

  return {
    ...row,
    nutriments,
  } as FoodProduct;
}

// ─────────────────────────────────────────────────────────────────────────────
// Foundation Food Lookup (USDA Foundation JSON)
// ─────────────────────────────────────────────────────────────────────────────

async function getFoundationById(fdcId: string): Promise<FoodProduct | null> {
  const numericId = Number.parseInt(fdcId, 10);
  if (Number.isNaN(numericId)) {
    console.log("[getById] Invalid foundation ID:", fdcId);
    return null;
  }

  const food = await getFoundationFoodById(numericId);
  if (!food) {
    console.log("[getById] Foundation food not found:", numericId);
    return null;
  }

  console.log("[getById] Found foundation food:", food.description);
  return mapFoundationToProduct(food);
}

/**
 * Get full details for a specific food by ID.
 *
 * @param dataSource - "foundation" for real/whole foods, "branded" for commercial products
 */
export const getById = publicProcedure
  .input(FoodGetByIdInputSchema)
  .query(async ({ input, ctx }) => {
    const { id, dataSource } = input;
    console.log("[getById] Looking up food:", id, "from", dataSource);

    // 1. Check custom foods first (only for branded data source)
    if (ctx.session && dataSource === "branded") {
      const custom = await ctx.db.query.customFood.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.id, id), eq(t.userId, ctx.session?.user.id ?? "")),
      });
      if (custom) {
        console.log("[getById] Found custom food");
        return mapCustomFoodToProduct({
          ...custom,
          nutriments: custom.nutriments as Record<string, number> | null,
        });
      }
    }

    // 2. Look up based on data source
    if (dataSource === "foundation") {
      return await getFoundationById(id);
    }

    // Branded food lookup
    const result = await getBrandedFoodById(id);
    if (!result) {
      console.log("[getById] No rows found for code:", id);
      return null;
    }

    console.log("[getById] Returning food:", result.code);
    return result;
  });
