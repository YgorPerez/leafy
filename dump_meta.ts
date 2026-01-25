import fs from "node:fs";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

async function main() {
	const instance = await DuckDBInstance.create();
	const connection = await instance.connect();
	const parquetPath = path.join(process.cwd(), "food.parquet");
	const reader = await connection.runAndReadAll(
		`DESCRIBE SELECT * FROM "${parquetPath}"`,
	);
	const columns = reader.getRowObjects();
	fs.writeFileSync("columns_meta.json", JSON.stringify(columns, null, 2));
	console.log(`Wrote ${columns.length} columns to columns_meta.json`);
}

main().catch(console.error);
