import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { dailyLog } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";
import { calculateScalingFactor } from "../food.utils";

/**
 * Input schema for updating a food log entry.
 */
const UpdateLogInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  loggedAt: z.union([z.string(), z.number(), z.date()]).optional(),
});

/**
 * Recalculate energy from macros using Atwater General Factors.
 */
function recalculateEnergy(nutrients: Record<string, number>): void {
  const p = nutrients.protein ?? 0;
  const f = nutrients.fat ?? 0;
  const c =
    nutrients.carbohydrate ?? (nutrients.starch ?? 0) + (nutrients.sugar ?? 0);
  const a = nutrients.alcohol ?? 0;

  if (p > 0 || f > 0 || c > 0 || a > 0) {
    nutrients.energy = Number((p * 4 + c * 4 + f * 9 + a * 7).toFixed(2));
  }
}

/**
 * Update a food log entry (quantity/unit) and recalculate scaled nutrients.
 */
export const updateLog = publicProcedure
  .input(UpdateLogInputSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session) throw new Error("Unauthorized");

    const userId = ctx.session.user.id;

    // Fetch the existing log entry
    const existingLog = await ctx.db.query.dailyLog.findFirst({
      where: and(eq(dailyLog.id, input.id), eq(dailyLog.userId, userId)),
    });

    if (!existingLog) {
      throw new Error("Log entry not found");
    }

    const newQuantity = input.quantity ?? existingLog.quantity;
    const newUnit = input.unit ?? existingLog.unit;

    // Use unit-aware scaling: convert both old and new to their gram equivalents
    const oldGramFactor = calculateScalingFactor(
      existingLog.quantity,
      existingLog.unit,
    );
    const newGramFactor = calculateScalingFactor(newQuantity, newUnit);
    const scalingFactor = oldGramFactor !== 0 ? newGramFactor / oldGramFactor : 1;

    // Scale nutrients proportionally
    let updatedNutrients = existingLog.nutrients;
    if (scalingFactor !== 1 && existingLog.nutrients) {
      updatedNutrients = Object.fromEntries(
        Object.entries(existingLog.nutrients).map(([key, value]) => [
          key,
          Number((value * scalingFactor).toFixed(2)),
        ]),
      );
      // Recalculate energy from macros to ensure kcal stays consistent
      recalculateEnergy(updatedNutrients);
    }

    // Update the log entry
    await ctx.db
      .update(dailyLog)
      .set({
        quantity: newQuantity,
        unit: newUnit,
        nutrients: updatedNutrients,
        ...(input.loggedAt ? { loggedAt: new Date(input.loggedAt) } : {}),
      })
      .where(and(eq(dailyLog.id, input.id), eq(dailyLog.userId, userId)));

    return { success: true };
  });
