import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sql, eq } from 'drizzle-orm';

const client = createClient({ url: process.env.DATABASE_URL });

// Import schema dynamically won't work easily, so let's just check what users exist
// and try the raw insert pattern that logWater uses
try {
  const users = await client.execute("SELECT id FROM user LIMIT 1");
  console.log('Users:', users.rows);

  if (users.rows.length > 0) {
    const userId = users.rows[0].id;
    console.log('Using userId:', userId);

    // Simulate what logWater does - INSERT into daily_log
    // The key question: does logged_at need to be explicitly set?
    const result = await client.execute({
      sql: "INSERT INTO daily_log (id, user_id, date, food_code, food_name, quantity, unit, nutrients) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: ['water-test-1', userId, '2026-01-01', '__water__', 'Water', 250, 'ml', JSON.stringify({ water: 0.25 })]
    });
    console.log('Insert WITHOUT logged_at succeeded:', result);

    // Cleanup
    await client.execute({ sql: "DELETE FROM daily_log WHERE id = ?", args: ['water-test-1'] });
    console.log('Cleanup done');
  }
} catch (e) {
  console.error('Error:', e.message);
  console.error('Full error:', e);
}

process.exit(0);
