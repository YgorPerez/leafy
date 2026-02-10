import type { Client } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

type DbInstance = LibSQLDatabase<typeof schema>;

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Client | undefined;
  db: DbInstance | undefined;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const initClient = () => {
  const c = createClient({ url: process.env.DATABASE_URL! });
  // Enable WAL mode for concurrent read/write support and avoid SQLITE_BUSY
  void c.execute("PRAGMA journal_mode=WAL;");
  return c;
};

export const client = globalForDb.client ?? initClient();
globalForDb.client = client;

export const db: DbInstance =
  globalForDb.db ?? drizzle(client, { schema, casing: "snake_case" });
globalForDb.db = db;
