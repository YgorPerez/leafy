import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { user, weightLog } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

export const logWeight = publicProcedure
  .input(
    z.object({
      date: z.string(),
      weight: z.number().positive(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user) {
      throw new Error("Unauthorized");
    }

    const userId = ctx.session.user.id;

    // Upsert: check if entry exists for this user+date
    const existing = await ctx.db.query.weightLog.findFirst({
      where: and(eq(weightLog.userId, userId), eq(weightLog.date, input.date)),
    });

    if (existing) {
      await ctx.db
        .update(weightLog)
        .set({ weight: input.weight })
        .where(eq(weightLog.id, existing.id));
    } else {
      await ctx.db.insert(weightLog).values({
        userId,
        date: input.date,
        weight: input.weight,
      });
    }

    // Keep user profile weight current
    await ctx.db
      .update(user)
      .set({ weight: input.weight })
      .where(eq(user.id, userId));

    return { success: true };
  });
