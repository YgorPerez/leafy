import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

async function main() {
	const instance = await DuckDBInstance.create();
	const connection = await instance.connect();
	const parquetPath = path.join(process.cwd(), "food.parquet");
	// Check the structure of unnested product_name
	const reader = await connection.runAndReadAll(
		`SELECT * FROM (SELECT UNNEST(product_name) as p FROM "${parquetPath}" LIMIT 1)`,
	);
	console.log(JSON.stringify(reader.getRowObjects(), null, 2));
}

main().catch(console.error);
