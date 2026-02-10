import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sql } from 'drizzle-orm';

const client = createClient({ url: process.env.DATABASE_URL });
const db = drizzle(client);

// Check if we can query
try {
  const result = await db.run(sql`SELECT COUNT(*) as cnt FROM daily_log`);
  console.log('Read works:', result);
} catch (e) {
  console.error('Read failed:', e.message);
}

// Check if we can write via Drizzle with raw SQL
try {
  await db.run(sql`INSERT INTO daily_log (id, user_id, date, food_code, food_name, quantity, unit, nutrients, logged_at) VALUES ('drizzle-test', 'fake', '2026-01-01', '__test__', 'Test', 100, 'g', '{}', unixepoch())`);
  console.log('Drizzle write succeeded!');
} catch (e) {
  console.error('Drizzle write failed:', e.message);
}

// Cleanup
try {
  await db.run(sql`DELETE FROM daily_log WHERE id = 'drizzle-test'`);
} catch (e) {
  // ignore
}

process.exit(0);
