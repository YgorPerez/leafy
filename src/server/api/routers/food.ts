import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { FOOD_PARQUET_PATH, getDuckDBConnection } from "~/server/duckdb";
import { FoodSearchOutputSchema, FoodSearchSchema } from "./food.schema";

export const foodRouter = createTRPCRouter({
	search: publicProcedure
		.input(z.object({ query: z.string(), limit: z.number().default(10) }))
		.output(FoodSearchOutputSchema)
		.query(async ({ input }) => {
			const connection = await getDuckDBConnection();

			// SQL injection safe templating isn't directly supported for the file path in DuckDB usually
			// but here we are using a constant for the path and parameters for the query.
			const sql = `
        SELECT
          code,
          product_name[1].text as product_name,
          brands,
          categories,
          nutriscore_grade,
          COALESCE(scans_n, 0) as scans_n
        FROM "${FOOD_PARQUET_PATH}"
        WHERE len(list_filter(product_name, x -> x.text ILIKE ?)) > 0 OR brands ILIKE ?
        ORDER BY
          (CASE
            WHEN lower(product_name[1].text) = lower(?) THEN 0
            WHEN lower(product_name[1].text) ILIKE ? || ' %' THEN 1
            WHEN lower(product_name[1].text) ILIKE '% ' || ? || ' %' THEN 2
            WHEN lower(product_name[1].text) ILIKE '% ' || ? THEN 3
            ELSE 4
          END) ASC,
          COALESCE(scans_n, 0) DESC,
          len(product_name[1].text) ASC
        LIMIT ?
      `;

			const reader = await connection.runAndReadAll(sql, [
				`%${input.query}%`,
				`%${input.query}%`,
				input.query,
				input.query,
				input.query,
				input.query,
				input.limit,
			]);

			return reader.getRowObjects().map((row: Record<string, unknown>) => {
				const result: Record<string, unknown> = {};
				for (const [key, value] of Object.entries(row)) {
					result[key] = typeof value === "bigint" ? Number(value) : value;
				}
				return result;
			}) as any;
		}),

	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.output(FoodSearchSchema.nullable())
		.query(async ({ input }) => {
			const connection = await getDuckDBConnection();
			const sql = `
        SELECT
          code,
          product_name[1].text as product_name,
          brands,
          categories,
          nutriscore_grade,
          COALESCE(scans_n, 0) as scans_n
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
});
