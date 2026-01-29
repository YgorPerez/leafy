import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { dailyLog, user } from "~/server/db/schema";
import { FOOD_PARQUET_PATH, getDuckDBConnection } from "~/server/duckdb";
import { FoodProductSchema, FoodSearchOutputSchema } from "./food.schema";

export const foodRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(10) }))
    .output(FoodSearchOutputSchema)
    .query(async ({ input, ctx }) => {
      const { query, limit } = input;
      const normalizedQuery = query.toLowerCase();

      // 1. Search Custom Foods (Private Silo)
      // Only if user is logged in
      let customResults: any[] = [];
      if (ctx.session) {
        customResults = await ctx.db.query.customFood.findMany({
          where: (table, { and, eq, like, or }) =>
            and(
              eq(table.userId, ctx.session?.user.id ?? ""),
              or(
                like(table.name, `%${query}%`),
                like(table.brand, `%${query}%`),
              ),
            ),
          limit: limit,
        });
        // Map to output format
        customResults = customResults.map((f) => ({
          code: f.id,
          product_name: f.name,
          brands: f.brand,
          categories: "Custom",
          nutriscore_grade: "unknown",
          scans_n: 0,
          source: "User",
        }));
      }

      // 2. Search Global Data (Hierarchy of Truth)
      const connection = await getDuckDBConnection();

      // Source Priority Logic:
      // NCCDB (Not present yet, but logic placeholder)
      // USDA (creator ILIKE '%usda%') -> Priority 1
      // Others -> Priority 2

      // We also keep the comprehensive text matching priority
      const sql = `
        SELECT
          code,
          product_name[1].text as product_name,
          brands,
          categories,
          nutriscore_grade,
          COALESCE(scans_n, 0) as scans_n,
          CASE
            WHEN creator ILIKE '%usda%' THEN 'USDA'
            WHEN creator ILIKE '%nccdb%' THEN 'NCCDB'
            ELSE 'Branded'
          END as source,
          (CASE
            WHEN creator ILIKE '%nccdb%' THEN 1
            WHEN creator ILIKE '%usda%' THEN 2
            ELSE 3
          END) as source_rank
        FROM "${FOOD_PARQUET_PATH}"
        WHERE len(list_filter(product_name, x -> x.text ILIKE ?)) > 0 OR brands ILIKE ?
        ORDER BY
          source_rank ASC,
          (CASE
            WHEN lower(product_name[1].text) = lower(?) THEN 0
            WHEN lower(product_name[1].text) ILIKE ? || ' %' THEN 1
            WHEN lower(product_name[1].text) ILIKE '% ' || ? || ' %' THEN 2
            WHEN lower(product_name[1].text) ILIKE '% ' || ? THEN 3
            ELSE 4
          END) ASC,
          COALESCE(scans_n, 0) DESC
        LIMIT ?
      `;

      const reader = await connection.runAndReadAll(sql, [
        `%${input.query}%`,
        `%${input.query}%`,
        input.query,
        input.query,
        input.query,
        input.query,
        input.limit, // Fetch full limit from parquet too in case custom is empty
      ]);

      const globalResults = reader
        .getRowObjects()
        .map((row: Record<string, unknown>) => {
          const result: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(row)) {
            result[key] = typeof value === "bigint" ? Number(value) : value;
          }
          // Remove internal ranking fields if accidentally included (though map creates new obj)
          return result;
        });

      return [...customResults, ...globalResults].slice(0, limit) as any;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(FoodProductSchema.nullable()) // Return full details
    .query(async ({ input }) => {
      const connection = await getDuckDBConnection();
      const sql = `
        SELECT *
        FROM "${FOOD_PARQUET_PATH}"
        WHERE code = ?
        LIMIT 1
      `;
      const reader = await connection.runAndReadAll(sql, [input.id]);
      const rows = reader.getRowObjects();

      if (rows.length === 0) return null;

      const row = rows[0] as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        result[key] = typeof value === "bigint" ? Number(value) : value;
      }
      return result as any;
    }),

  logFoods: publicProcedure
    .input(
      z.array(
        z.object({
          date: z.string(),
          foodName: z.string(),
          foodBrand: z.string().nullable().optional(),
          foodCode: z.string().optional(),
          source: z.enum(["NCCDB", "USDA", "Branded", "User"]).optional(),
          quantity: z.number(),
          unit: z.string(),
          nutrients: z.record(z.number()).optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const connection = await getDuckDBConnection();

      const logsToInsert = await Promise.all(
        input.map(async (item) => {
          const finalNutrients = item.nutrients || {};

          // If nutrients missing, try to resolve
          if (
            Object.keys(finalNutrients).length === 0 &&
            item.foodCode &&
            item.source
          ) {
            let rawFood: any = null;

            if (item.source === "User" && userId) {
              const custom = await ctx.db.query.customFood.findFirst({
                where: (t, { and, eq }) =>
                  and(eq(t.id, item.foodCode!), eq(t.userId, userId)),
              });
              if (custom && custom.nutriments) {
                rawFood = { nutriments: custom.nutriments };
              }
            } else {
              // Global lookup
              const sql = `SELECT nutriments FROM "${FOOD_PARQUET_PATH}" WHERE code = ? LIMIT 1`;
              const reader = await connection.runAndReadAll(sql, [
                item.foodCode,
              ]);
              const rows = reader.getRowObjects();
              if (rows.length > 0) {
                rawFood = rows[0];
              }
            }

            if (rawFood && rawFood.nutriments) {
              // Parse OpenFoodFacts style nutriments array or simple object
              // OFF schema: nutriments is array of { name, value, unit, 100g }
              // OR it might be flattened columns in some parquets, but strict schema says array.
              // Assuming schema matched `FoodProductSchema`: nutriments: { ... }[]

              const baseValues: Record<string, number> = {};

              // Helper to find value in array
              // Note: Parquet 'nutriments' column might be complex struct or list.
              // In 'food.schema.ts' we defined it as array.
              // In DuckDB result it comes as array of objects.
              let nutriArray = rawFood.nutriments as any;

              // Handle DuckDB struct format (items wrapper)
              if (
                nutriArray &&
                !Array.isArray(nutriArray) &&
                Array.isArray(nutriArray.items)
              ) {
                nutriArray = nutriArray.items;
              }

              if (Array.isArray(nutriArray)) {
                nutriArray.forEach((nItem: any) => {
                  // Handle entries wrapper if present
                  const n = nItem.entries ?? nItem;

                  // Prefer 100g value
                  const val = n["100g"] ?? n.value ?? 0;
                  // Map common names to our clinical schema keys
                  // e.g. 'proteins' -> 'protein'
                  // This mapping can be extensive.
                  // Simplified mapping:
                  // "energy-kcal", "proteins", "carbohydrates", "fat", "fiber", "sodium"
                  // "vitamin-c", "iron", "calcium", "vitamin-a", "potassium"
                  // Note: OFF tags are typically hyphenated.
                  let key = n.name?.toLowerCase();
                  if (!key) return; // skip

                  // Normalize keys
                  const mapping: Record<string, string> = {
                    "energy-kcal": "energy_kcal",
                    proteins: "protein",
                    carbohydrates: "carbohydrate",
                    "saturated-fat": "saturatedFat",
                    "trans-fat": "transFat",
                    cholesterol: "cholesterol",
                    "vitamin-c": "vitaminC",
                    "vitamin-a": "vitaminA",
                    "vitamin-d": "vitaminD",
                    "vitamin-e": "vitaminE",
                    "vitamin-k": "vitaminK",
                    "vitamin-b6": "vitaminB6",
                    "vitamin-b12": "vitaminB12",
                    "pantothenic-acid": "pantothenicAcid",
                    "folic-acid": "folate",
                  };

                  if (mapping[key]) {
                    key = mapping[key];
                  } else {
                    // General normalization: dashes to camelCase?
                    // For now, manual mapping is safer.
                    if (key.includes("fiber")) key = "fiber";
                    else if (key.includes("iron")) key = "iron";
                    else if (key.includes("calcium")) key = "calcium";
                    else if (key.includes("potassium")) key = "potassium";
                    else if (key.includes("sodium")) key = "sodium";
                    else if (key.includes("magnesium")) key = "magnesium";
                    else if (key.includes("zinc")) key = "zinc";
                  }

                  if (val) baseValues[key] = Number(val);
                });
              }

              // Scale
              // Default to 100g base
              let factor = item.quantity / 100;
              if (item.unit === "oz") factor = (item.quantity * 28.35) / 100;
              // if 'serving', needs serving size from rawFood, else fallback to 100g logic for now is safer than broken math

              for (const [k, v] of Object.entries(baseValues)) {
                finalNutrients[k] = Number((v * factor).toFixed(2));
              }
            }
          }

          return {
            userId: userId ?? "", // Temporary fallback for type, we won't insert if empty
            date: item.date,
            foodName: item.foodName,
            foodBrand: item.foodBrand || null,
            quantity: item.quantity,
            unit: item.unit,
            nutrients: finalNutrients,
          };
        }),
      );

      if (userId) {
        await ctx.db.insert(dailyLog).values(logsToInsert);
      }
      return { success: true, logs: logsToInsert };
    }),

  getDailyNutrition: publicProcedure // Consider using protectedProcedure for user-specific actions
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session) return null;

      const logs = await ctx.db.query.dailyLog.findMany({
        where: and(
          eq(dailyLog.userId, ctx.session.user.id),
          eq(dailyLog.date, input.date),
        ),
      });

      // Aggregate
      const totals: Record<string, number> = {};
      for (const log of logs) {
        const nuts =
          typeof log.nutrients === "string"
            ? JSON.parse(log.nutrients)
            : log.nutrients;
        if (nuts) {
          for (const [key, val] of Object.entries(nuts)) {
            totals[key] = (totals[key] || 0) + (Number(val) || 0);
          }
        }
      }
      return totals;
    }),

  getDailyLogs: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session) return [];

      return await ctx.db.query.dailyLog.findMany({
        where: and(
          eq(dailyLog.userId, ctx.session.user.id),
          eq(dailyLog.date, input.date),
        ),
        orderBy: (dailyLog, { desc }) => [desc(dailyLog.createdAt)],
      });
    }),

  deleteLog: publicProcedure
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
    }),

  updateProfile: publicProcedure
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
        .update(user) // Ensure 'user' is imported from schema
        .set({
          sex: input.sex,
          birthDate: input.birthDate,
          weight: input.weight,
          height: input.height,
          activityLevel: input.activityLevel,
        })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }),

  updateGoals: publicProcedure
    .input(z.object({ goals: z.record(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("Unauthorized");
      }
      await ctx.db
        .update(user)
        .set({
          goals: input.goals,
        })
        .where(eq(user.id, ctx.session.user.id));
      return { success: true };
    }),
});
