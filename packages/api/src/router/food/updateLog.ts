import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { dailyLog } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

/**
 * Input schema for updating a food log entry.
 */
const UpdateLogInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
});

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

    // Calculate the scaling factor if quantity changed
    const oldQuantity = existingLog.quantity;
    const newQuantity = input.quantity ?? oldQuantity;
    const scalingFactor = newQuantity / oldQuantity;

    // Scale nutrients proportionally
    let updatedNutrients = existingLog.nutrients;
    if (scalingFactor !== 1 && existingLog.nutrients) {
      updatedNutrients = Object.fromEntries(
        Object.entries(existingLog.nutrients).map(([key, value]) => [
          key,
          value * scalingFactor,
        ]),
      );
    }

    // Update the log entry
    await ctx.db
      .update(dailyLog)
      .set({
        quantity: newQuantity,
        unit: input.unit ?? existingLog.unit,
        nutrients: updatedNutrients,
      })
      .where(and(eq(dailyLog.id, input.id), eq(dailyLog.userId, userId)));

    return { success: true };
  });
