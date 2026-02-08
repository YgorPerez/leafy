import { eq } from "drizzle-orm";
import { z } from "zod";

import { user } from "@acme/db/schema";

import { publicProcedure } from "../../trpc";

export const updateDashboardConfig = publicProcedure
  .input(
    z.object({
      widgets: z.array(
        z.object({
          id: z.string(),
          order: z.number(),
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
      .set({ dashboardConfig: { widgets: input.widgets } })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  });
