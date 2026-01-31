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
export const FOOD_PARQUET_PATH = path.join(process.cwd(), "food.parquet");

/** Path to the DuckDB database file (persistent storage) */
export const DUCKDB_PATH = path.join(process.cwd(), "food.db");

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

let instance: DuckDBInstance | null = null;
let persistentConnection: DuckDBConnection | null = null;
let tablesInitialized = false;

// ─────────────────────────────────────────────────────────────────────────────
// Table Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create the food_search table - lightweight table for search queries.
 * Only includes columns needed for search results.
 */
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
    FROM "${FOOD_PARQUET_PATH}"
  `);

  const elapsed = Date.now() - startTime;
  console.log(`[duckdb] food_search table created in ${elapsed}ms`);
}

/**
 * Create the food_details table - full product details for getById queries.
 * Includes all columns needed for product detail views.
 */
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
    FROM "${FOOD_PARQUET_PATH}"
  `);

  const elapsed = Date.now() - startTime;
  console.log(`[duckdb] food_details table created in ${elapsed}ms`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if the required tables already exist in the database.
 */
async function checkTablesExist(
  connection: DuckDBConnection,
): Promise<boolean> {
  const result = await connection.runAndReadAll(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name IN ('food_search', 'food_details')
  `);

  const tables = result.getRowObjects().map((row) => row.table_name);
  const hasSearch = tables.includes("food_search");
  const hasDetails = tables.includes("food_details");

  console.log(
    `[duckdb] Tables exist check: food_search=${hasSearch}, food_details=${hasDetails}`,
  );

  return hasSearch && hasDetails;
}

/**
 * Initialize the DuckDB database with required tables.
 * Tables are only created if they don't exist (for fast startup).
 */
async function initializeTables(connection: DuckDBConnection): Promise<void> {
  if (tablesInitialized) {
    return;
  }

  console.log("[duckdb] Checking if tables need to be created...");

  const tablesExist = await checkTablesExist(connection);

  if (tablesExist) {
    console.log("[duckdb] Tables already exist, skipping creation");
    tablesInitialized = true;
    return;
  }

  console.log("[duckdb] Tables not found, creating from parquet file...");
  console.log("[duckdb] This may take several minutes for large files...");

  await createSearchTable(connection);
  await createDetailsTable(connection);

  tablesInitialized = true;
  console.log("[duckdb] All tables created successfully");
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a connection to the DuckDB database.
 * Creates the database and tables if they don't exist.
 */
export async function getDuckDBConnection(): Promise<DuckDBConnection> {
  if (!instance) {
    console.log(`[duckdb] Creating persistent database at: ${DUCKDB_PATH}`);
    instance = await DuckDBInstance.create(DUCKDB_PATH);
  }

  if (!persistentConnection) {
    persistentConnection = await instance.connect();

    // Configure DuckDB settings for optimal performance
    await persistentConnection.run(`
      SET memory_limit = '2GB';
      SET threads = 4;
      SET enable_object_cache = true;
    `);

    // Initialize tables if needed
    await initializeTables(persistentConnection);
  }

  return persistentConnection;
}

/**
 * Execute a query on the food database.
 */
export async function queryFood(sql: string, params?: DuckDBValue[]) {
  const connection = await getDuckDBConnection();
  if (params) {
    return await connection.runAndReadAll(sql, params);
  }
  return await connection.runAndReadAll(sql);
}

/**
 * Clear the DuckDB cache and connections.
 * Note: This does NOT delete the database file or tables.
 */
export function clearDuckDBCache() {
  persistentConnection = null;
  instance = null;
  tablesInitialized = false;
}

/**
 * Force rebuild tables from the parquet file.
 * Use this when the parquet file has been updated.
 */
export async function rebuildTables(): Promise<void> {
  const connection = await getDuckDBConnection();

  console.log("[duckdb] Dropping existing tables...");
  await connection.run("DROP TABLE IF EXISTS food_search");
  await connection.run("DROP TABLE IF EXISTS food_details");

  tablesInitialized = false;

  console.log("[duckdb] Rebuilding tables from parquet...");
  await initializeTables(connection);
}

/**
 * Check if tables are initialized and ready.
 */
export function isInitialized(): boolean {
  return tablesInitialized;
}
