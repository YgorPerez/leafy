import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

let instance: DuckDBInstance | null = null;

export async function getDuckDBConnection() {
	if (!instance) {
		// ":memory:" is the default, but we can also specify a file for the DB state if needed.
		// For querying a Parquet file, an in-memory instance is usually sufficient.
		instance = await DuckDBInstance.create();
	}
	return await instance.connect();
}

export const FOOD_PARQUET_PATH = path.join(process.cwd(), "food.parquet");

/**
 * Helper to query the food parquet file
 */
export async function queryFood(sql: string, params?: any[]) {
	const connection = await getDuckDBConnection();
	// Ensure the SQL uses the correct path to the parquet file if it's not already dynamic
	// For example, replacing a placeholder or just trusting the caller.
	// Better yet, we can provide a method that specifically queries this file.

	if (params) {
		return await connection.runAndReadAll(sql, params);
	}
	return await connection.runAndReadAll(sql);
}
