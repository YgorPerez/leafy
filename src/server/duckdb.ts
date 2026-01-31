import {
  DuckDBInstance,
  type DuckDBConnection,
  type DuckDBValue,
} from "@duckdb/node-api";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Instance & Connection Pool
// ─────────────────────────────────────────────────────────────────────────────

let instance: DuckDBInstance | null = null;
let persistentConnection: DuckDBConnection | null = null;

/**
 * Get or create the DuckDB instance.
 * Uses a persistent connection for better performance.
 */
export async function getDuckDBConnection(): Promise<DuckDBConnection> {
  if (!instance) {
    instance = await DuckDBInstance.create();
  }

  // Reuse connection instead of creating new ones
  if (!persistentConnection) {
    persistentConnection = await instance.connect();

    // Configure DuckDB for better parquet query performance
    await persistentConnection.run(`
      SET memory_limit = '2GB';
      SET threads = 4;
      SET enable_object_cache = true;
    `);

    // Create a view that pre-computes commonly used fields for faster querying
    // This avoids recomputing source detection and extracting product_name on every query
    await persistentConnection.run(`
      CREATE OR REPLACE VIEW food_search AS
      SELECT
        code,
        product_name[1].text as product_name_text,
        lower(product_name[1].text) as product_name_lower,
        brands,
        lower(brands) as brands_lower,
        categories,
        nutriscore_grade,
        COALESCE(scans_n, 0) as scans_n,
        creator,
        CASE
          WHEN contains(lower(creator), 'nccdb') THEN 'NCCDB'
          WHEN contains(lower(creator), 'usda') THEN 'USDA'
          WHEN contains(lower(creator), 'cnf') THEN 'CNF'
          WHEN contains(lower(creator), 'ifcdb') THEN 'IFCDB'
          ELSE 'Branded'
        END as source,
        CASE
          WHEN contains(lower(creator), 'nccdb') THEN 1
          WHEN contains(lower(creator), 'usda') THEN 2
          WHEN contains(lower(creator), 'cnf') THEN 3
          WHEN contains(lower(creator), 'ifcdb') THEN 4
          ELSE 5
        END as source_priority,
        CASE
          WHEN contains(lower(categories), 'raw') OR contains(lower(categories), 'fresh') OR contains(lower(categories), 'whole') THEN 1
          WHEN contains(lower(categories), 'fruits') OR contains(lower(categories), 'vegetables') THEN 3
          ELSE 10
        END as category_priority
      FROM "${FOOD_PARQUET_PATH}"
    `);
  }

  return persistentConnection;
}

export const FOOD_PARQUET_PATH = path.join(process.cwd(), "food.parquet");

// ─────────────────────────────────────────────────────────────────────────────
// Prepared Statement Cache
// ─────────────────────────────────────────────────────────────────────────────

const preparedStatements = new Map<
  string,
  Awaited<ReturnType<DuckDBConnection["prepare"]>>
>();

/**
 * Get or create a prepared statement for a given SQL query.
 * Prepared statements are cached for reuse.
 */
export async function getPreparedStatement(
  connection: DuckDBConnection,
  name: string,
  sql: string,
) {
  if (!preparedStatements.has(name)) {
    const stmt = await connection.prepare(sql);
    preparedStatements.set(name, stmt);
  }
  return preparedStatements.get(name)!;
}

/**
 * Helper to query the food parquet file
 */
export async function queryFood(sql: string, params?: DuckDBValue[]) {
  const connection = await getDuckDBConnection();
  if (params) {
    return await connection.runAndReadAll(sql, params);
  }
  return await connection.runAndReadAll(sql);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clear cached resources.
 * Note: DuckDB node-api handles cleanup automatically.
 */
export function clearDuckDBCache() {
  preparedStatements.clear();
  persistentConnection = null;
  instance = null;
}
