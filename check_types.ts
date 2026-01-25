import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

async function main() {
	const instance = await DuckDBInstance.create();
	const connection = await instance.connect();
	const parquetPath = path.join(process.cwd(), "food.parquet");
	const reader = await connection.runAndReadAll(
		`DESCRIBE SELECT product_name, brands FROM "${parquetPath}" LIMIT 1`,
	);
	console.log(JSON.stringify(reader.getRowObjects(), null, 2));
}

main().catch(console.error);
