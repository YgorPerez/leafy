import * as fs from "fs";
import * as path from "path";
import { getDuckDBConnection } from "../src/server/duckdb";

async function main() {
  console.log("Starting nutrient key extraction...");
  const keys = new Set<string>();

  // 1. Extract from DuckDB (Parquet)
  console.log("Querying DuckDB...");
  const db = await getDuckDBConnection();

  // We need to see how nutriments are stored.
  // Based on food.utils.ts, it seems to be a list of structs.
  // We can try to UNNEST it to get names.

  // Note: The table might be food_details.
  // Let's check if we can select distinct nutrient names.
  // If nutriments is a LIST(STRUCT(name VARCHAR, ...))

  try {
    const result = await db.runAndReadAll(`
      SELECT DISTINCT unnested_nutriment.name
      FROM (
        SELECT UNNEST(nutriments) as unnested_nutriment
        FROM food_details
      )
      WHERE unnested_nutriment.name IS NOT NULL
    `);

    const rows = result.getRowObjects();
    console.log(`Found ${rows.length} keys in DuckDB.`);
    for (const row of rows) {
      if (typeof row.name === "string") {
        keys.add(row.name);
      }
    }
  } catch (e) {
    console.error("Error querying DuckDB:", e);
  }

  // 2. Extract from USDA Foundation JSON
  console.log("Reading USDA Foundation JSON...");
  const jsonPath = path.join(
    process.cwd(),
    "data",
    "source",
    "USDA-foundation.json",
  );

  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(rawData);

    if (data.FoundationFoods && Array.isArray(data.FoundationFoods)) {
      console.log(
        `Processing ${data.FoundationFoods.length} foundation foods...`,
      );
      for (const food of data.FoundationFoods) {
        if (food.foodNutrients && Array.isArray(food.foodNutrients)) {
          for (const nutrient of food.foodNutrients) {
            if (nutrient.nutrient && nutrient.nutrient.name) {
              keys.add(nutrient.nutrient.name);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Error reading JSON:", e);
  }

  // 3. Output sorted list
  const sortedKeys = Array.from(keys).sort();
  console.log(`Total unique keys: ${sortedKeys.length}`);

  const outputPath = path.join(process.cwd(), "nutrient_keys.json");
  fs.writeFileSync(outputPath, JSON.stringify(sortedKeys, null, 2));
  console.log(`Wrote keys to ${outputPath}`);

  // Also basic stats
  console.log("Sample keys:", sortedKeys.slice(0, 10));
}

main().catch(console.error);
