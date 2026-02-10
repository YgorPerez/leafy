import { createClient } from '@libsql/client';

const c = createClient({ url: process.env.DATABASE_URL });

const r = await c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log('Tables:', r.rows.map(r => r.name));

const cols = await c.execute("PRAGMA table_info(daily_log)");
console.log('daily_log columns:', cols.rows.map(r => r.name));

const meal = await c.execute("PRAGMA table_info(meal)");
console.log('meal columns:', meal.rows.map(r => r.name));

// Try a test write
try {
  await c.execute({
    sql: "INSERT INTO daily_log (id, user_id, date, food_code, food_name, quantity, unit, nutrients, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())",
    args: ['test-123', 'fake-user', '2026-01-01', '__test__', 'Test Food', 100, 'g', '{}']
  });
  console.log('Write succeeded!');
  await c.execute({ sql: "DELETE FROM daily_log WHERE id = ?", args: ['test-123'] });
  console.log('Cleanup succeeded!');
} catch (e) {
  console.error('Write failed:', e.message);
}

process.exit(0);
