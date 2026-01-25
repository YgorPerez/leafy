import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

async function main() {
	const instance = await DuckDBInstance.create();
	const connection = await instance.connect();
	const parquetPath = path.join(process.cwd(), "food.parquet");
	const query = "banana";
	const sql = `
    SELECT
      code,
      product_name[1].text as product_name,
      categories,
      nutriscore_grade,
      scans_n
    FROM "${parquetPath}"
    WHERE
      (len(list_filter(product_name, x -> x.text ILIKE ?)) > 0 OR brands ILIKE ?)
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
    LIMIT 10
  `;
	try {
		const reader = await connection.runAndReadAll(sql, [
			"%" + query + "%",
			"%" + query + "%",
			query,
			query,
			query,
			query,
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
