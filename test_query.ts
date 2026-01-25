import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

async function main() {
	const instance = await DuckDBInstance.create();
	const connection = await instance.connect();
	const parquetPath = path.join(process.cwd(), "food.parquet");
	const query = "%apple%";
	const sql = `
    SELECT
      code,
      (SELECT text FROM UNNEST(product_name) LIMIT 1) as product_name,
      brands,
      categories,
      nutriscore_grade
    FROM "${parquetPath}"
    WHERE EXISTS (SELECT 1 FROM UNNEST(product_name) t WHERE t.text ILIKE ?) OR brands ILIKE ?
    LIMIT 5
  `;
	try {
		const reader = await connection.runAndReadAll(sql, [query, query]);
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
