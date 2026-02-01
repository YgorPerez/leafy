import type { FoodProduct } from "../food.schema";
import { getDuckDBConnection } from "../../duckdb";
import { publicProcedure } from "../../trpc";
import { buildGetByIdSQL } from "../food.queries";
import { FoodGetByIdInputSchema } from "../food.schema";
import {
  convertBigIntsToNumbers,
  mapCustomFoodToProduct,
  parseNutrimentsFromDuckDB,
} from "../food.utils";
import { getFoundationFoodById, mapFoundationToProduct } from "./foundation";

// ─────────────────────────────────────────────────────────────────────────────
// (Moved mapCustomFoodToProduct to food.utils.ts)

// ─────────────────────────────────────────────────────────────────────────────
// Branded Food Lookup (OpenFoodFacts parquet)
// ─────────────────────────────────────────────────────────────────────────────

async function getBrandedFoodById(code: string): Promise<FoodProduct | null> {
  const connection = await getDuckDBConnection();
  const sql = buildGetByIdSQL();

  const reader = await connection.runAndReadAll(sql, [code]);
  const rows = reader.getRowObjects();

  if (rows.length === 0) {
    return null;
  }

  const row = convertBigIntsToNumbers(rows[0] as Record<string, unknown>);

  // Parse nutriments from DuckDB format
  const nutriments = parseNutrimentsFromDuckDB(row.nutriments);

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
    return null;
  }

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

    // 1. Check custom foods first (only for branded data source)
    if (ctx.session && dataSource === "branded") {
      const custom = await ctx.db.query.customFood.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.id, id), eq(t.userId, ctx.session?.user.id ?? "")),
      });
      if (custom) {
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
    return result;
  });
