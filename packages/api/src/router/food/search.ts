import type { FoodSearchResult, FoodSource } from "../food.schema";
import { getDuckDBConnection } from "../../duckdb";
import { publicProcedure } from "../../trpc";
import { buildSearchSQL } from "../food.queries";
import { FoodSearchInputSchema, FoodSearchOutputSchema } from "../food.schema";
import {
  convertBigIntsToNumbers,
  mapCustomFoodToSearchResult,
} from "../food.utils";
import {
  mapFoundationToSearchResult,
  searchFoundationFoods,
} from "./foundation";

// (Moved mapCustomFoodToSearchResult to food.utils.ts)

async function searchBrandedFoods(
  query: string,
  limit: number,
): Promise<FoodSearchResult[]> {
  const connection = await getDuckDBConnection();
  const reader = await connection.runAndReadAll(buildSearchSQL(), [
    query,
    query,
    query,
    limit,
  ]);

  return reader
    .getRowObjects()
    .map((row) => convertBigIntsToNumbers(row as Record<string, unknown>))
    .map((row) => ({
      code: row.code as string | null,
      product_name: row.product_name as string | null,
      brands: row.brands as string | null,
      categories: row.categories as string | null,
      nutriscore_grade: row.nutriscore_grade as string | null,
      scans_n: row.scans_n as number | null,
      source: (row.source as FoodSource) ?? "Branded",
    }));
}

async function searchFoundation(
  query: string,
  limit: number,
): Promise<FoodSearchResult[]> {
  const foods = await searchFoundationFoods(query, limit);
  return foods.map(mapFoundationToSearchResult);
}

export const search = publicProcedure
  .input(FoodSearchInputSchema)
  .output(FoodSearchOutputSchema)
  .query(async ({ input, ctx }) => {
    const { query, limit, dataSource } = input;
    const searchPattern = `%${query}%`;

    let customResults: FoodSearchResult[] = [];
    if (ctx.session && dataSource === "branded") {
      const customFoods = await ctx.db.query.customFood.findMany({
        where: (table, { and, eq, like, or }) =>
          and(
            eq(table.userId, ctx.session?.user.id ?? ""),
            or(
              like(table.name, searchPattern),
              like(table.brand, searchPattern),
            ),
          ),
        limit,
      });
      customResults = customFoods.map(mapCustomFoodToSearchResult);
    }

    let globalResults: FoodSearchResult[];

    if (dataSource === "foundation") {
      globalResults = await searchFoundation(query, limit);
    } else {
      globalResults = await searchBrandedFoods(query, limit);
    }

    return [...customResults, ...globalResults].slice(0, limit);
  });
