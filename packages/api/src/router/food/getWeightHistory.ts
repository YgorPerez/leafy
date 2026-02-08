import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { weightLog } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

export const getWeightHistory = publicProcedure
  .input(z.object({ days: z.number().optional().default(30) }))
  .query(async ({ ctx, input }) => {
    if (!ctx.session?.user) {
      return [];
    }

    const entries = await ctx.db.query.weightLog.findMany({
      where: eq(weightLog.userId, ctx.session.user.id),
      orderBy: [desc(weightLog.date)],
      limit: input.days,
    });

    return entries
      .map((e) => ({ date: e.date, weight: e.weight }))
      .reverse();
  });
