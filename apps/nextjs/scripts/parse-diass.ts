import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(
  __dirname,
  "../data/source/Ileal IAA digestibility and DIAAS of world foods_Molly Muleya_November 2021.xlsx",
);

// Check if file exists first
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const workbook = xlsx.readFile(filePath);
const SHEET_NAME = "IAA digestibility";

const mapHeaderToAA: Record<number, string> = {
  6: "tryptophan",
  7: "threonine",
  8: "isoleucine",
  9: "leucine",
  10: "lysine",
  11: "methionine",
  12: "cysteine",
  13: "phenylalanine",
  14: "tyrosine",
  15: "valine",
  16: "arginine",
  17: "histidine",
};

const worksheet = workbook.Sheets[SHEET_NAME];
if (!worksheet) {
  console.error(`Sheet "${SHEET_NAME}" not found`);
  process.exit(1);
}

type RawRow = (string | number | null)[];

const data = xlsx.utils.sheet_to_json<RawRow>(worksheet, {
  header: 1,
  range: 3,
  defval: null,
});

export interface DiassEntry {
  name: string;
  group: string;
  coefficients: Partial<Record<string, number>>;
}

const db: Record<string, DiassEntry> = {};

data.forEach((row) => {
  const foodName = row[0];
  if (!foodName || typeof foodName !== "string") return;

  const coefficients: Partial<Record<string, number>> = {};
  let hasData = false;

  for (const [colStr, aaName] of Object.entries(mapHeaderToAA)) {
    const colIndex = Number(colStr);
    const value = row[colIndex];
    if (typeof value === "number") {
      coefficients[aaName] = value;
      hasData = true;
    }
  }

  if (hasData) {
    const key = foodName.toLowerCase().replace(/[^a-z0-9]/g, "");
    db[key] = {
      name: foodName,
      group: String(row[1] ?? "Unknown"),
      coefficients,
    };
  }
});

const tsContent = `// Auto-generated from "${path.basename(filePath)}"
// Do not edit manually

export interface DiassEntry {
  name: string;
  group: string;
  coefficients: Partial<Record<string, number>>;
}

export const DIASS_DB: Record<string, DiassEntry> = ${JSON.stringify(db, null, 2)};
`;

const outPath = path.join(
  __dirname,
  "../../../packages/api/src/lib/data/diass-db.ts",
);
const outDir = path.dirname(outPath);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outPath, tsContent);
console.log(`Generated ${Object.keys(db).length} entries in ${outPath}`);
