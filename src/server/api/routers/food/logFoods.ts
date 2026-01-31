import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { dailyLog } from "~/server/db/schema";
import { getDuckDBConnection } from "~/server/duckdb";
import { buildGetNutrimentsSQL } from "../food.queries";
import { LogFoodInputSchema } from "../food.schema";
import {
  calculateScalingFactor,
  extractNutrientValues,
  normalizeNutrientKey,
  scaleNutrients,
} from "../food.utils";
import { getFoundationFoodById } from "./foundation";

/**
 * Extract nutrient values from a foundation food.
 */
/**
 * Extract nutrient values from a foundation food.
 */
async function extractFoundationNutrients(
  fdcId: number,
): Promise<Record<string, number> | null> {
  const food = await getFoundationFoodById(fdcId);
  if (!food) return null;

  const nutrients: Record<string, number> = {};
  for (const nutrient of food.foodNutrients) {
    // Use normalized key for consistency
    const key = normalizeNutrientKey(nutrient.nutrient.name);
    if (key) {
      nutrients[key] = nutrient.amount ?? 0;
    }
  }
  return nutrients;
}

/**
 * Log foods for a user's daily intake tracking.
 */
export const logFoods = publicProcedure
  .input(z.array(LogFoodInputSchema))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const connection = await getDuckDBConnection();

    const logsToInsert = await Promise.all(
      input.map(async (item) => {
        let finalNutrients = item.nutrients ?? {};

        // Resolve nutrients if not provided
        if (Object.keys(finalNutrients).length === 0 && item.foodCode) {
          let baseNutrients: Record<string, number> | null = null;

          // Custom food lookup
          if (item.source === "User" && userId) {
            const custom = await ctx.db.query.customFood.findFirst({
              where: (t, { and, eq }) =>
                and(eq(t.id, item.foodCode!), eq(t.userId, userId)),
            });

            if (custom?.nutriments) {
              baseNutrients = custom.nutriments as Record<string, number>;
            }
          }
          // Foundation food lookup
          else if (
            item.source === "Foundation" ||
            item.dataSource === "foundation"
          ) {
            const fdcId = Number.parseInt(item.foodCode, 10);
            if (!Number.isNaN(fdcId)) {
              baseNutrients = await extractFoundationNutrients(fdcId);
            }
          }
          // Global database lookup (branded foods)
          else {
            const reader = await connection.runAndReadAll(
              buildGetNutrimentsSQL(),
              [item.foodCode],
            );
            const rows = reader.getRowObjects();

            if (rows.length > 0 && rows[0]) {
              const row = rows[0] as Record<string, unknown>;
              if (row.nutriments) {
                baseNutrients = extractNutrientValues(row.nutriments);
              }
            }
          }

          if (baseNutrients) {
            const factor = calculateScalingFactor(item.quantity, item.unit);
            finalNutrients = scaleNutrients(baseNutrients, factor);
          }
        }

        return {
          userId: userId ?? "",
          date: item.date,
          foodName: item.foodName,
          foodBrand: item.foodBrand ?? null,
          quantity: item.quantity,
          unit: item.unit,
          nutrients: finalNutrients,
        };
      }),
    );

    if (userId) {
      await ctx.db.insert(dailyLog).values(logsToInsert);
    }

    return { success: true, logs: logsToInsert };
  });
