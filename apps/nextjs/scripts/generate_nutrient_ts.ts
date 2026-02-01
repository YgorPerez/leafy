import * as fs from "fs";
import * as path from "path";

function main() {
  const jsonPath = path.join(process.cwd(), "nutrient_keys.json");
  const outputPath = path.join(
    process.cwd(),
    "src",
    "server",
    "api",
    "routers",
    "nutrient-keys.ts",
  );

  console.log("Reading keys...");
  const keys = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as string[];

  // Escape keys for string literals
  const escapedKeys = keys.map((k) =>
    k.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"'),
  );

  const fileContent = `// Generated file - do not edit manually
// Source: nutrient_keys.json from Data Discovery phase

export const NUTRIENT_KEYS = [
${escapedKeys.map((k) => `  "${k}",`).join("\n")}
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
`;

  fs.writeFileSync(outputPath, fileContent, "utf-8");
  console.log(`Generated ${outputPath} with ${keys.length} keys.`);
}

main();
