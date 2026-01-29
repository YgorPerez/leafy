import { DuckDBInstance } from "@duckdb/node-api";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parquetPath = path.join(__dirname, "food.parquet").replace(/\\/g, "/");

async function main() {
  console.log("Querying", parquetPath);
  try {
    const instance = await DuckDBInstance.create();
    const conn = await instance.connect();

    // The SQL query from food.ts had: product_name[1].text
    // because product_name is a struct array in some versions.
    // Let's check what product_name is.

    // First, just get * for one row to inspect structure
    const reader = await conn.run(`
      SELECT code, product_name, nutriments
      FROM "${parquetPath}"
      WHERE len(list_filter(product_name, x -> x.text ILIKE '%banana%')) > 0
      LIMIT 1
    `);

    // If run returns a reader/result
    // The API might differ. Let's try to assume we can iterate or fetch.
    const rows = await reader.getRowObjects();
    const fs = await import("fs");
    fs.writeFileSync(
      "debug_duckdb_objects.json",
      JSON.stringify(rows, null, 2),
    );
    console.log("Written to debug_duckdb_objects.json");
  } catch (e) {
    console.error(e);
  }
}

main();
