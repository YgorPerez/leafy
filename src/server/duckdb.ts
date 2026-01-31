import {
  DuckDBInstance,
  type DuckDBConnection,
  type DuckDBValue,
} from "@duckdb/node-api";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Path to the parquet file (source data) */
export const FOOD_PARQUET_PATH = path.join(
  process.cwd(),
  "data",
  "source",
  "food.parquet",
);

/** Path to the USDA Foundation JSON file (source data) */
export const FOUNDATION_JSON_PATH = path.join(
  process.cwd(),
  "data",
  "source",
  "USDA-foundation.json",
);

/** Path to the DuckDB database file (persistent storage) */
export const DUCKDB_PATH = path.join(
  process.cwd(),
  "data",
  "duckdb",
  "food_v2.db",
);

// ─────────────────────────────────────────────────────────────────────────────
// Global Singleton Pattern (Dev Mode Persistence)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * We use a very specific key on globalThis to ensure the connection survives
 * HMR (Hot Module Replacement) updates in development.
 */
const GLOBAL_DUCKDB_INSTANCE = "__duckdb_instance__";
const GLOBAL_DUCKDB_CONN = "__duckdb_connection__";
const GLOBAL_DUCKDB_INIT = "__duckdb_initialized__";

const globalAny = globalThis as any;

// ─────────────────────────────────────────────────────────────────────────────
// Table Definitions
// ─────────────────────────────────────────────────────────────────────────────

async function createSearchTable(connection: DuckDBConnection): Promise<void> {
  console.log("[duckdb] Creating food_search table from parquet...");
  const startTime = Date.now();

  await connection.run(`
    CREATE TABLE IF NOT EXISTS food_search AS
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
        WHEN contains(lower(creator), 'cnf') THEN 'CNF'
        WHEN contains(lower(creator), 'ifcdb') THEN 'IFCDB'
        ELSE 'Branded'
      END as source,
      CASE
        WHEN contains(lower(creator), 'cnf') THEN 1
        WHEN contains(lower(creator), 'ifcdb') THEN 2
        ELSE 3
      END as source_priority
    FROM "${FOOD_PARQUET_PATH.replace(/\\/g, "/")}"
  `);

  console.log(
    `[duckdb] food_search table created in ${Date.now() - startTime}ms`,
  );
}

async function createDetailsTable(connection: DuckDBConnection): Promise<void> {
  console.log("[duckdb] Creating food_details table from parquet...");
  const startTime = Date.now();

  await connection.run(`
    CREATE TABLE IF NOT EXISTS food_details AS
    SELECT
      code,
      product_name,
      brands,
      brands_tags,
      categories,
      categories_tags,
      categories_properties,
      generic_name,
      ingredients_text,
      ingredients_n,
      quantity,
      serving_quantity,
      serving_size,
      nutriscore_grade,
      nutriscore_score,
      nova_group,
      ecoscore_grade,
      ecoscore_score,
      allergens_tags,
      additives_tags,
      additives_n,
      nutriments,
      countries_tags,
      stores,
      created_t,
      last_modified_t,
      creator,
      scans_n,
      unique_scans_n,
      completeness,
      popularity_key
    FROM "${FOOD_PARQUET_PATH.replace(/\\/g, "/")}"
  `);

  console.log(
    `[duckdb] food_details table created in ${Date.now() - startTime}ms`,
  );
}

async function createFoundationSearchTable(
  connection: DuckDBConnection,
): Promise<void> {
  console.log("[duckdb] Creating foundation_search table from JSON...");
  const startTime = Date.now();

  await connection.run(`
    CREATE TABLE IF NOT EXISTS foundation_search AS
    SELECT
      food.fdcId as fdcId,
      food.description as description,
      lower(food.description) as lower_description,
      food.foodCategory.description as category
    FROM (
      SELECT UNNEST(FoundationFoods) as food
      FROM read_json("${FOUNDATION_JSON_PATH.replace(/\\/g, "/")}")
    )
  `);

  console.log(
    `[duckdb] foundation_search table created in ${Date.now() - startTime}ms`,
  );
}

async function createFoundationDetailsTable(
  connection: DuckDBConnection,
): Promise<void> {
  console.log("[duckdb] Creating foundation_details table from JSON...");
  const startTime = Date.now();

  // We explicitly select the fields we need to be safe, or use to_json
  // Actually, let's use to_json but cast it to VARCHAR to ensure consistent string result for Zod
  await connection.run(`
    CREATE TABLE IF NOT EXISTS foundation_details AS
    SELECT
      food.fdcId as fdcId,
      CAST(to_json(food) AS VARCHAR) as json_data
    FROM (
      SELECT UNNEST(FoundationFoods) as food
      FROM read_json("${FOUNDATION_JSON_PATH.replace(/\\/g, "/")}")
    )
  `);

  console.log(
    `[duckdb] foundation_details table created in ${Date.now() - startTime}ms`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────

async function checkTablesExist(connection: DuckDBConnection) {
  const result = await connection.runAndReadAll(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name IN ('food_search', 'food_details', 'foundation_search', 'foundation_details')
  `);
  const tables = result.getRowObjects().map((row) => row.table_name);
  return {
    branded: tables.includes("food_search") && tables.includes("food_details"),
    foundation:
      tables.includes("foundation_search") &&
      tables.includes("foundation_details"),
  };
}

async function initializeTables(connection: DuckDBConnection): Promise<void> {
  if (globalAny[GLOBAL_DUCKDB_INIT]) return;

  const { branded, foundation } = await checkTablesExist(connection);

  if (!branded) {
    await createSearchTable(connection);
    await createDetailsTable(connection);
  }

  if (!foundation) {
    await createFoundationSearchTable(connection);
    await createFoundationDetailsTable(connection);
  }

  globalAny[GLOBAL_DUCKDB_INIT] = true;
  console.log("[duckdb] All tables checked/created successfully");
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

let currentConnectionPromise: Promise<DuckDBConnection> | null = null;

export async function getDuckDBConnection(): Promise<DuckDBConnection> {
  // 1. Return existing connection if available
  if (globalAny[GLOBAL_DUCKDB_CONN]) {
    return globalAny[GLOBAL_DUCKDB_CONN];
  }

  // 2. Resolve concurrent connection attempts
  if (currentConnectionPromise) {
    return currentConnectionPromise;
  }

  currentConnectionPromise = (async () => {
    try {
      console.log(`[duckdb] Initializing database at: ${DUCKDB_PATH}`);

      if (!globalAny[GLOBAL_DUCKDB_INSTANCE]) {
        globalAny[GLOBAL_DUCKDB_INSTANCE] =
          await DuckDBInstance.create(DUCKDB_PATH);
      }

      const conn = await globalAny[GLOBAL_DUCKDB_INSTANCE].connect();

      await conn.run(`
        SET memory_limit = '2GB';
        SET threads = 4;
        SET enable_object_cache = true;
      `);

      await initializeTables(conn);

      globalAny[GLOBAL_DUCKDB_CONN] = conn;
      return conn;
    } catch (e) {
      currentConnectionPromise = null;
      throw e;
    }
  })();

  return currentConnectionPromise;
}

export async function queryFood(sql: string, params?: DuckDBValue[]) {
  const connection = await getDuckDBConnection();
  if (params) {
    return await connection.runAndReadAll(sql, params);
  }
  return await connection.runAndReadAll(sql);
}

export function clearDuckDBCache() {
  globalAny[GLOBAL_DUCKDB_CONN] = undefined;
  globalAny[GLOBAL_DUCKDB_INSTANCE] = undefined;
  globalAny[GLOBAL_DUCKDB_INIT] = false;
}

export async function rebuildTables(): Promise<void> {
  const connection = await getDuckDBConnection();
  await connection.run("DROP TABLE IF EXISTS food_search");
  await connection.run("DROP TABLE IF EXISTS food_details");
  await connection.run("DROP TABLE IF EXISTS foundation_search");
  await connection.run("DROP TABLE IF EXISTS foundation_details");
  globalAny[GLOBAL_DUCKDB_INIT] = false;
  await initializeTables(connection);
}

export function isInitialized(): boolean {
  return globalAny[GLOBAL_DUCKDB_INIT] ?? false;
}
