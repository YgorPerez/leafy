import * as fs from "fs";
import { FOOD_PARQUET_PATH, getDuckDBConnection } from "./src/server/duckdb";

async function run() {
  const code = "0609207617761";
  const connection = await getDuckDBConnection();
  const sql = `SELECT * FROM "${FOOD_PARQUET_PATH}" WHERE code = ?`;
  const reader = await connection.runAndReadAll(sql, [code]);
  const rows = reader.getRowObjects();

  const serialized = JSON.stringify(
    rows,
    (key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );

  fs.writeFileSync("debug_output_2.json", serialized);
}

run();
