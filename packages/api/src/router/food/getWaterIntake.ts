import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { dailyLog } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

export const getWaterIntake = publicProcedure
  .input(z.object({ date: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!ctx.session?.user) {
      return { total_ml: 0 };
    }

    const result = await ctx.db
      .select({ total: sql<number>`coalesce(sum(${dailyLog.quantity}), 0)` })
      .from(dailyLog)
      .where(
        and(
          eq(dailyLog.userId, ctx.session.user.id),
          eq(dailyLog.date, input.date),
          eq(dailyLog.foodCode, "__water__"),
        ),
      );

    return { total_ml: result[0]?.total ?? 0 };
  });
