import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { user } from "~/server/db/schema";

/**
 * Update user's nutritional goals.
 */
export const updateGoals = publicProcedure
  .input(z.object({ goals: z.record(z.number()) }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user) {
      throw new Error("Unauthorized");
    }

    await ctx.db
      .update(user)
      .set({ goals: input.goals })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  });
