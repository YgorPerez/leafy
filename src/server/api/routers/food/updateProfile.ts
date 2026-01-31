import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { user } from "~/server/db/schema";

/**
 * Update user profile information.
 */
export const updateProfile = publicProcedure
  .input(
    z.object({
      sex: z.enum(["male", "female"]),
      birthDate: z.date(),
      weight: z.number(),
      height: z.number(),
      activityLevel: z.enum(["sedentary", "low", "active", "very_active"]),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user) {
      throw new Error("Unauthorized");
    }

    await ctx.db
      .update(user)
      .set({
        sex: input.sex,
        birthDate: input.birthDate,
        weight: input.weight,
        height: input.height,
        activityLevel: input.activityLevel,
      })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  });
