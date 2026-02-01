import { eq } from "drizzle-orm";
import { z } from "zod";

import { user } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

/**
 * Update user's nutritional goals.
 */
export const updateGoals = publicProcedure
  .input(
    z.object({
      goals: z.record(
        z.object({
          target: z.number().optional(),
          min: z.number().optional(),
          max: z.number().optional(),
        }),
      ),
    }),
  )
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
