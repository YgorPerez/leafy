import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { dailyLog, meal } from "@acme/db/schema";

import { getDuckDBConnection } from "../../duckdb";
import { protectedProcedure } from "../../trpc";
import { buildGetNutrimentsSQL } from "../food.queries";
import { LogFoodInputSchema } from "../food.schema";
import {
  calculateScalingFactor,
  extractNutrientValues,
  scaleNutrients,
} from "../food.utils";
import { getFoundationFoodById } from "./foundation";

/**
 * Extract nutrient values from a foundation food.
 */
async function extractFoundationNutrients(
  foodId: number,
  quantity: number,
  unit: string,
): Promise<Record<string, number> | undefined> {
  const food = await getFoundationFoodById(foodId);
  if (!food) return undefined;

  // For foundation foods, we use the same generic scaling factor logic for now
  // or we could implement portion-specific logic here.
  const scalingFactor = calculateScalingFactor(quantity, unit);
  const rawNutrients = extractNutrientValues(food);
  return scaleNutrients(rawNutrients, scalingFactor);
}

/**
 * Log food items to the database.
 */
export const logFoods = protectedProcedure
  .input(z.array(LogFoodInputSchema))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const firstItem = input[0];
    if (!firstItem) return { success: true, count: 0 };

    const firstLoggedAt = firstItem.loggedAt
      ? new Date(firstItem.loggedAt)
      : new Date();

    // Try to find an existing meal within a 5-minute window to group with
    const GROUPING_WINDOW_SEC = 5 * 60;
    const loggedAtEpoch = Math.floor(firstLoggedAt.getTime() / 1000);
    const windowStartEpoch = loggedAtEpoch - GROUPING_WINDOW_SEC;
    const windowEndEpoch = loggedAtEpoch + GROUPING_WINDOW_SEC;

    // Resolve all nutrients BEFORE the transaction (DuckDB/foundation are external)
    const resolvedNutrients = await Promise.all(
      input.map(async (item) => {
        let nutrients = item.nutrients;

        const isFoundation =
          item.dataSource === "foundation" || item.source === "Foundation";
        if (!nutrients && isFoundation && item.foodCode) {
          nutrients = await extractFoundationNutrients(
            Number(item.foodCode),
            item.quantity,
            item.unit,
          );
        }

        if (!nutrients && item.foodCode) {
          try {
            const connection = await getDuckDBConnection();
            const nutSql = buildGetNutrimentsSQL();
            const reader = await connection.runAndReadAll(nutSql, [
              item.foodCode,
            ]);
            const rows = reader.getRowObjects();
            if (rows.length > 0) {
              const row = rows[0] as Record<string, unknown>;
              const rawNutrients = extractNutrientValues(row.nutriments);
              const scalingFactor = calculateScalingFactor(
                item.quantity,
                item.unit,
              );
              nutrients = scaleNutrients(rawNutrients, scalingFactor);
            }
          } catch (e) {
            console.error("Failed to fetch nutrients from DuckDB:", e);
          }
        }

        return nutrients ?? {};
      }),
    );

    // All SQLite writes inside a single transaction for atomicity
    return await ctx.db.transaction(async (tx) => {
      const existingMeals = await tx
        .select({ id: meal.id })
        .from(meal)
        .where(
          and(
            eq(meal.userId, userId),
            eq(meal.date, firstItem.date),
            sql`${meal.loggedAt} >= ${windowStartEpoch}`,
            sql`${meal.loggedAt} <= ${windowEndEpoch}`,
          ),
        )
        .limit(1);

      let mealId: string;

      if (existingMeals[0]) {
        mealId = existingMeals[0].id;
      } else {
        const mealResult = await tx
          .insert(meal)
          .values({
            userId,
            date: firstItem.date,
            name: "Logged Meal",
            loggedAt: firstLoggedAt,
          })
          .returning({ id: meal.id });

        const newMealId = mealResult[0]?.id;
        if (!newMealId) {
          throw new Error("Failed to create meal record");
        }
        mealId = newMealId;
      }

      for (let i = 0; i < input.length; i++) {
        const item = input[i]!;
        await tx.insert(dailyLog).values({
          mealId,
          userId,
          date: item.date,
          loggedAt: item.loggedAt ? new Date(item.loggedAt) : firstLoggedAt,
          foodCode: item.foodCode ?? "unknown",
          foodName: item.foodName,
          foodBrand: item.foodBrand,
          quantity: item.quantity,
          unit: item.unit,
          nutrients: resolvedNutrients[i]!,
        });
      }

      return { success: true, count: input.length };
    });
  });
