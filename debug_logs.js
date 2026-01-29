import { createClient } from "@libsql/client";

// Assuming db.sqlite is in current directory
const dbPath = "file:db.sqlite";

async function main() {
  console.log("Connecting to", dbPath);
  const client = createClient({ url: dbPath });
  try {
    const result = await client.execute(
      "SELECT * FROM daily_log ORDER BY createdAt DESC LIMIT 5",
    );
    console.log("Found", result.rows.length, "logs");
    const fs = await import("fs");
    fs.writeFileSync("debug_output.json", JSON.stringify(result.rows, null, 2));
    console.log("Written to debug_output.json");
  } catch (e) {
    console.error(e);
  }
}

main();
