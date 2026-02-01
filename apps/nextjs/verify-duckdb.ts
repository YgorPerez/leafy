import { getDuckDBConnection, isInitialized } from "./src/server/duckdb";

async function verify() {
  try {
    console.log("Checking DuckDB initialization...");
    const conn = await getDuckDBConnection();
    console.log("Connection established.");
    console.log("Is initialized:", isInitialized());

    const result = await conn.runAndReadAll("SELECT 1 as test");
    console.log("Test query result:", result.getRowObjects());

    process.exit(0);
  } catch (e) {
    console.error("Verification failed:", e);
    process.exit(1);
  }
}

verify();
