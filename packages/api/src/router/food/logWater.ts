import { z } from "zod";

import { dailyLog } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

export const logWater = publicProcedure
  .input(
    z.object({
      date: z.string(),
      amount_ml: z.number().positive(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert(dailyLog).values({
      userId: ctx.session.user.id,
      date: input.date,
      foodCode: "__water__",
      foodName: "Water",
      quantity: input.amount_ml,
      unit: "ml",
      nutrients: { water: input.amount_ml / 1000 },
    });

    return { success: true };
  });
