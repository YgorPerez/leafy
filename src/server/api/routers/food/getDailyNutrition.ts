import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { dailyLog } from "~/server/db/schema";
import { type NutrientTotals } from "../food.schema";

/**
 * Get aggregated nutrition totals for a specific date.
 */
export const getDailyNutrition = publicProcedure
  .input(z.object({ date: z.string() }))
  .query(async ({ ctx, input }): Promise<NutrientTotals | null> => {
    if (!ctx.session) return null;

    const logs = await ctx.db.query.dailyLog.findMany({
      where: and(
        eq(dailyLog.userId, ctx.session.user.id),
        eq(dailyLog.date, input.date),
      ),
    });

    const totals: NutrientTotals = {};
    for (const log of logs) {
      const nuts =
        typeof log.nutrients === "string"
          ? (JSON.parse(log.nutrients) as Record<string, number>)
          : log.nutrients;

      if (nuts) {
        for (const [key, val] of Object.entries(nuts)) {
          totals[key] = (totals[key] ?? 0) + (Number(val) || 0);
        }
      }
    }

    return totals;
  });
