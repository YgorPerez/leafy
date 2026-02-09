import { and, eq, like } from "drizzle-orm";
import { z } from "zod";

import { dailyLog, day } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dayRouter = createTRPCRouter({
  copy: protectedProcedure
    .input(z.object({ fromDate: z.string(), toDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { fromDate, toDate } = input;
      const userId = ctx.session.user.id;

      // 1. Get logs from source day
      const sourceLogs = await ctx.db.query.dailyLog.findMany({
        where: and(eq(dailyLog.userId, userId), eq(dailyLog.date, fromDate)),
      });

      if (sourceLogs.length === 0) {
        return { count: 0 };
      }

      // 2. Insert logs into target day
      // We exclude id to let DB generate new ones, and update date
      const logsToInsert = sourceLogs.map((log) => ({
        userId,
        date: toDate,
        foodCode: log.foodCode,
        foodName: log.foodName,
        foodBrand: log.foodBrand,
        quantity: log.quantity,
        unit: log.unit,
        nutrients: log.nutrients,
      }));

      await ctx.db.insert(dailyLog).values(logsToInsert);

      return { count: logsToInsert.length };
    }),

  toggleCompletion: protectedProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { date } = input;
      const userId = ctx.session.user.id;

      const existingDay = await ctx.db.query.day.findFirst({
        where: and(eq(day.userId, userId), eq(day.date, date)),
      });

      if (existingDay) {
        const newStatus =
          existingDay.status === "completed" ? "active" : "completed";
        await ctx.db
          .update(day)
          .set({ status: newStatus })
          .where(eq(day.id, existingDay.id));
        return { status: newStatus };
      } else {
        await ctx.db.insert(day).values({
          userId,
          date,
          status: "completed",
        });
        return { status: "completed" };
      }
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { date } = input;
      const userId = ctx.session.user.id;

      const existingDay = await ctx.db.query.day.findFirst({
        where: and(eq(day.userId, userId), eq(day.date, date)),
      });

      if (existingDay) {
        const newIsFavorite = !existingDay.isFavorite;
        await ctx.db
          .update(day)
          .set({ isFavorite: newIsFavorite })
          .where(eq(day.id, existingDay.id));
        return { isFavorite: newIsFavorite };
      } else {
        await ctx.db.insert(day).values({
          userId,
          date,
          isFavorite: true,
        });
        return { isFavorite: true };
      }
    }),

  get: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const { date } = input;
      const userId = ctx.session.user.id;

      const dayData = await ctx.db.query.day.findFirst({
        where: and(eq(day.userId, userId), eq(day.date, date)),
      });

      return dayData ?? null;
    }),

  getMonth: protectedProcedure
    .input(z.object({ month: z.string() })) // YYYY-MM
    .query(async ({ ctx, input }) => {
      const { month } = input;
      const userId = ctx.session.user.id;

      // 1. Fetch day records
      const days = await ctx.db.query.day.findMany({
        where: and(eq(day.userId, userId), like(day.date, `${month}%`)),
      });

      // 2. Fetch dates with logs
      const logs = await ctx.db
        .select({ date: dailyLog.date })
        .from(dailyLog)
        .where(
          and(eq(dailyLog.userId, userId), like(dailyLog.date, `${month}%`)),
        )
        .groupBy(dailyLog.date);

      const datesWithLogs = new Set(logs.map((l) => l.date));

      // 3. Merge
      const allDates = new Set([...days.map((d) => d.date), ...datesWithLogs]);

      const results = Array.from(allDates).map((date) => {
        const dayRecord = days.find((d) => d.date === date);
        return {
          id: dayRecord?.id, // Optional, might be undefined if only logs exist
          userId,
          date,
          status: dayRecord?.status ?? "active",
          isFavorite: dayRecord?.isFavorite ?? false,
          hasLogs: datesWithLogs.has(date),
          createdAt: dayRecord?.createdAt ?? new Date(), // Mock content for type if needed, or just return subset
          updatedAt: dayRecord?.updatedAt ?? new Date(),
        };
      });

      return results;
    }),
});
