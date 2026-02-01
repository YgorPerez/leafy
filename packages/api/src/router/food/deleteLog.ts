import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { dailyLog } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

/**
 * Delete a food log entry.
 */
export const deleteLog = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session) throw new Error("Unauthorized");

    await ctx.db
      .delete(dailyLog)
      .where(
        and(
          eq(dailyLog.id, input.id),
          eq(dailyLog.userId, ctx.session.user.id),
        ),
      );

    return { success: true };
  });
