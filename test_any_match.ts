import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

async function main() {
	const instance = await DuckDBInstance.create();
	const connection = await instance.connect();
	const parquetPath = path.join(process.cwd(), "food.parquet");
	const query = "apple";
	const sql = `
    SELECT
      code,
      product_name[1].text as product_name,
      brands
    FROM "${parquetPath}"
    WHERE any_match(product_name, x -> x.text ILIKE ?) OR brands ILIKE ?
    LIMIT 5
  `;
	try {
		const reader = await connection.runAndReadAll(sql, [
			`%${query}%`,
			`%${query}%`,
		]);
		console.log(
			JSON.stringify(
				reader.getRowObjects(),
				(k, v) => (typeof v === "bigint" ? v.toString() : v),
				2,
			),
		);
	} catch (e) {
		console.error(e);
	}
}

main().catch(console.error);
