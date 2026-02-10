import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { dailyLog, user } from "@acme/db/schema";

import type { BACResult } from "../../lib/bac";
import { calculateBAC } from "../../lib/bac";
import { protectedProcedure } from "../../trpc";

/**
 * Calculate estimated BAC from today's logged alcohol intake.
 */
export const getBAC = protectedProcedure
  .input(
    z.object({
      date: z.string(),
      hoursElapsed: z.number().min(0),
    }),
  )
  .query(async ({ ctx, input }): Promise<BACResult | null> => {
    const userId = ctx.session.user.id;

    // Get user profile for weight and sex
    const userProfile = await ctx.db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { weight: true, sex: true },
    });

    if (!userProfile?.weight || !userProfile?.sex) return null;
    if (userProfile.sex !== "male" && userProfile.sex !== "female") return null;

    // Get all logs for the date
    const logs = await ctx.db.query.dailyLog.findMany({
      where: and(
        eq(dailyLog.userId, userId),
        eq(dailyLog.date, input.date),
      ),
    });

    // Sum alcohol grams from all logged foods
    let totalAlcoholGrams = 0;
    for (const log of logs) {
      const nutrients =
        typeof log.nutrients === "string"
          ? (JSON.parse(log.nutrients) as Record<string, number>)
          : log.nutrients;

      if (nutrients?.alcohol) {
        totalAlcoholGrams += nutrients.alcohol;
      }
    }

    if (totalAlcoholGrams === 0) return null;

    return calculateBAC({
      alcoholGrams: totalAlcoholGrams,
      bodyWeightKg: userProfile.weight,
      sex: userProfile.sex as "male" | "female",
      hoursElapsed: input.hoursElapsed,
    });
  });
