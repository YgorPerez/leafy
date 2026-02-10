import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './src/schema.js';

const client = createClient({ url: process.env.DATABASE_URL! });
const db = drizzle(client, { schema, casing: 'snake_case', logger: true });

const userId = '4V98HeZqtaMquOJ6jMd5nXKZua0OndaI';

console.log('=== Test 1: logWater-style insert (no mealId, no loggedAt) ===');
try {
  await db.insert(schema.dailyLog).values({
    userId,
    date: '2026-01-01',
    foodCode: '__water__',
    foodName: 'Water',
    quantity: 250,
    unit: 'ml',
    nutrients: { water: 0.25 },
  });
  console.log('SUCCESS');
} catch (e: any) {
  console.error('FAILED:', e.message);
}

console.log('\n=== Test 2: logFoods-style insert (with mealId) ===');
try {
  // First create a meal
  const mealResult = await db.insert(schema.meal).values({
    userId,
    date: '2026-01-01',
    name: 'Test Meal',
    loggedAt: new Date(),
  }).returning({ id: schema.meal.id });
  console.log('Meal created:', mealResult);

  const mealId = mealResult[0]?.id;

  await db.insert(schema.dailyLog).values({
    mealId,
    userId,
    date: '2026-01-01',
    loggedAt: new Date(),
    foodCode: 'test-food',
    foodName: 'Test Food',
    quantity: 100,
    unit: 'g',
    nutrients: { energy: 200, protein: 10, fat: 5, carbohydrate: 30 },
  });
  console.log('SUCCESS');
} catch (e: any) {
  console.error('FAILED:', e.message);
}

// Cleanup
try {
  await db.delete(schema.dailyLog).where(eq(schema.dailyLog.date, '2026-01-01'));
  await db.delete(schema.meal).where(eq(schema.meal.date, '2026-01-01'));
  console.log('\nCleanup done');
} catch (e: any) {
  console.error('Cleanup failed:', e.message);
}

process.exit(0);
