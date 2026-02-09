import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { dailyLog, meal } from "@acme/db/schema";

import { calculateMealDIASS } from "../lib/diass";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const mealRouter = createTRPCRouter({
  getDailyMeals: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Fetch meals for the day
      const meals = await ctx.db.query.meal.findMany({
        where: and(eq(meal.userId, userId), eq(meal.date, input.date)),
        orderBy: desc(meal.loggedAt),
        with: {
          logs: true,
        },
      });

      // Fetch ungrouped logs (legacy or manual entries without meal)
      const ungroupedLogs = await ctx.db.query.dailyLog.findMany({
        where: and(
          eq(dailyLog.userId, userId),
          eq(dailyLog.date, input.date),
          isNull(dailyLog.mealId),
        ),
      });

      // Create a virtual meal for ungrouped items if any exist
      const allMeals = [...meals];
      if (ungroupedLogs.length > 0) {
        allMeals.push({
          id: "ungrouped",
          userId,
          date: input.date,
          name: "Ungrouped / Snacking",
          loggedAt: new Date(), // Just for sorting, maybe end of day
          createdAt: new Date(),
          updatedAt: new Date(),
          logs: ungroupedLogs,
        });
      }

      // Calculate DIASS for each meal
      const mealsWithScore = allMeals.map((m) => {
        const foodsForDiass = m.logs.map((log) => {
          const nutrients = log.nutrients as Record<string, number> | undefined;
          return {
            name: log.foodName,
            protein: nutrients?.protein ?? 0,
            nutrients: nutrients ?? {},
          };
        });

        const diass = calculateMealDIASS(foodsForDiass);

        const nutrients = m.logs.reduce(
          (acc, log) => {
            const logNutrients = log.nutrients;
            if (!logNutrients) return acc;
            acc.calories += logNutrients.energy ?? 0;
            acc.protein += logNutrients.protein ?? 0;
            acc.carbs += logNutrients.carbohydrate ?? 0;
            acc.fat += logNutrients.fat ?? 0;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );

        return {
          ...m,
          diass,
          nutrients,
        };
      });

      // Sort by time (including virtual meal)
      // mealsWithScore.sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());

      return mealsWithScore;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        loggedAt: z.union([z.string(), z.number(), z.date()]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db
        .update(meal)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.loggedAt ? { loggedAt: new Date(input.loggedAt) } : {}),
        })
        .where(and(eq(meal.id, input.id), eq(meal.userId, userId)));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Delete meal. Logs should cascade or set null depending on schema.
      // Schema says: `onDelete: "set null"` for dailyLog -> meal relation.
      // So logs become orphaned (ungrouped).

      await ctx.db
        .delete(meal)
        .where(and(eq(meal.id, input.id), eq(meal.userId, userId)));

      return { success: true };
    }),

  // Add functionality to split/move items if needed
});
