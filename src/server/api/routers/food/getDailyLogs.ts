import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { dailyLog } from "~/server/db/schema";

/**
 * Get all food logs for a specific date.
 */
export const getDailyLogs = publicProcedure
  .input(z.object({ date: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!ctx.session) return [];

    return ctx.db.query.dailyLog.findMany({
      where: and(
        eq(dailyLog.userId, ctx.session.user.id),
        eq(dailyLog.date, input.date),
      ),
      orderBy: (dailyLog, { desc }) => [desc(dailyLog.createdAt)],
    });
  });
