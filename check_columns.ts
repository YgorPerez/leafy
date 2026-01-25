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
	const filtered = columns.filter((c) =>
		c.column_name?.toString().startsWith("product_name"),
	);
	console.log(
		JSON.stringify(
			filtered.map((r) => ({ name: r.column_name, type: r.column_type })),
			null,
			2,
		),
	);
}

main().catch(console.error);
