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
    const connection = await getDuckDBConnection();

    // Grouping Logic
    // We'll rely on the first item's loggedAt to determine the meal for the batch if they are consistent.
    // For now, we process all inputs in one batch, assuming they are logged together
    const firstItem = input[0];
    if (!firstItem) return { success: true, count: 0 };

    const firstLoggedAt = firstItem.loggedAt
      ? new Date(firstItem.loggedAt)
      : new Date();

    const mealResult = await ctx.db
      .insert(meal)
      .values({
        userId,
        date: firstItem.date,
        name: "Logged Meal", // Required field in schema
        loggedAt: firstLoggedAt, // Drizzle expects Date for integer mode: timestamp
      })
      .returning({ id: meal.id });

    const mealId = mealResult[0]?.id;
    if (!mealId) {
      throw new Error("Failed to create meal record");
    }

    const logPromises = input.map(async (item) => {
      let nutrients = item.nutrients;

      // If nutrients are not provided, try to fetch them from foundation if applicable
      const isFoundation =
        item.dataSource === "foundation" || item.source === "Foundation";
      if (!nutrients && isFoundation && item.foodCode) {
        nutrients = await extractFoundationNutrients(
          Number(item.foodCode),
          item.quantity,
          item.unit,
        );
      }

      // If still no nutrients, we might need a fallback or query DuckDB for branded foods
      if (!nutrients && item.foodCode) {
        try {
          const sql = buildGetNutrimentsSQL();
          const reader = await connection.runAndReadAll(sql, [item.foodCode]);
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

      return ctx.db.insert(dailyLog).values({
        mealId,
        userId,
        date: item.date,
        loggedAt: item.loggedAt ? new Date(item.loggedAt) : firstLoggedAt,
        foodCode: item.foodCode ?? "unknown",
        foodName: item.foodName,
        foodBrand: item.foodBrand,
        quantity: item.quantity,
        unit: item.unit,
        nutrients: nutrients ?? {},
      });
    });

    await Promise.all(logPromises);

    return { success: true, count: input.length };
  });
