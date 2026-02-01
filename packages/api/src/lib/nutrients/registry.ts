import { z } from "zod";

import type { DRIMetrics } from "../../clinical-calculator";

export const NutrientCategorySchema = z.enum([
  "macro",
  "vitamin",
  "mineral",
  "other",
  "amino_acid",
]);
export type NutrientCategory = z.infer<typeof NutrientCategorySchema>;

/**
 * Nutrient Registry metadata schema
 */
export const NutrientMetadataSchema = z.object({
  label: z.string(),
  unit: z.string(),
  clinicalPath: z
    .string()
    .describe("Using string dot-notation for path lookup"),
  aliases: z.array(z.string()).or(z.array(z.string()).readonly()),
  category: NutrientCategorySchema,
  parent: z
    .string()
    .optional()
    .describe("Using string to avoid circular reference in const definition"),
});

export type NutrientMetadata = z.infer<typeof NutrientMetadataSchema>;

/**
 * Nutrient Registry
 * Centralizes metadata for all supported nutrients.
 */
export const NUTRIENT_REGISTRY = {
  // --- ENERGY ---
  energy: {
    label: "Energy",
    unit: "kcal",
    clinicalPath: "tee",
    aliases: ["energy", "energy-kcal", "Energy", "Energy-kcal", "energy_kCal"],
    category: "macro",
  },

  // --- CARBOHYDRATE GROUP ---
  carbohydrate: {
    label: "Carbohydrate",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.total",
    aliases: [
      "carbohydrates",
      "carbohydrates_100g",
      "Carbohydrate, by difference",
      "Carbohydrate, by summation",
      "carbohydrate",
    ],
    category: "macro",
  },
  starch: {
    label: "Starch",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.starch",
    aliases: ["starch", "Starch"],
    category: "macro",
    parent: "carbohydrate",
  },
  fiber: {
    label: "Dietary Fiber",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.fiber.total",
    aliases: [
      "fiber",
      "Fiber, total dietary",
      "Total dietary fiber (AOAC 2011.25)",
      "fiber_total",
    ],
    category: "macro",
    parent: "carbohydrate",
  },
  fiber_soluble: {
    label: "Soluble Fiber",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.fiber.soluble",
    aliases: ["fiber_soluble", "Fiber, soluble"],
    category: "macro",
    parent: "fiber",
  },
  fiber_insoluble: {
    label: "Insoluble Fiber",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.fiber.insoluble",
    aliases: ["fiber_insoluble", "Fiber, insoluble"],
    category: "macro",
    parent: "fiber",
  },
  sugar: {
    label: "Total Sugars",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.total",
    aliases: ["sugars", "Sugars, Total", "Total Sugars", "sugars_100g"],
    category: "macro",
    parent: "carbohydrate",
  },
  sugar_added: {
    label: "Added Sugars",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.added",
    aliases: [
      "added_sugar",
      "added sugars",
      "Sugars, added",
      "sugars_added",
      "addedSugar",
    ],
    category: "macro",
    parent: "sugar",
  },
  sugar_alcohol: {
    label: "Sugar Alcohol",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.alcohol",
    aliases: ["sugar_alcohol", "Sugar alcohols"],
    category: "macro",
    parent: "sugar",
  },
  fructose: {
    label: "Fructose",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.fructose",
    aliases: ["fructose", "Fructose"],
    category: "macro",
    parent: "sugar",
  },
  sucrose: {
    label: "Sucrose",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.sucrose",
    aliases: ["sucrose", "Sucrose"],
    category: "macro",
    parent: "sugar",
  },
  glucose: {
    label: "Glucose",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.glucose",
    aliases: ["glucose", "Glucose"],
    category: "macro",
    parent: "sugar",
  },
  lactose: {
    label: "Lactose",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.lactose",
    aliases: ["lactose", "Lactose"],
    category: "macro",
    parent: "sugar",
  },
  maltose: {
    label: "Maltose",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.maltose",
    aliases: ["maltose", "Maltose"],
    category: "macro",
    parent: "sugar",
  },
  galactose: {
    label: "Galactose",
    unit: "g",
    clinicalPath: "nutrients.carbohydrate.sugar.galactose",
    aliases: ["galactose", "Galactose"],
    category: "macro",
    parent: "sugar",
  },

  // --- PROTEIN GROUP ---
  protein: {
    label: "Protein",
    unit: "g",
    clinicalPath: "nutrients.protein.total",
    aliases: ["protein", "proteins", "Protein"],
    category: "macro",
  },
  alanine: {
    label: "Alanine",
    unit: "g",
    clinicalPath: "nutrients.protein.alanine",
    aliases: ["alanine", "Alanine"],
    category: "amino_acid",
    parent: "protein",
  },
  arginine: {
    label: "Arginine",
    unit: "g",
    clinicalPath: "nutrients.protein.arginine",
    aliases: ["arginine", "Arginine"],
    category: "amino_acid",
    parent: "protein",
  },
  aspartic_acid: {
    label: "Aspartic Acid",
    unit: "g",
    clinicalPath: "nutrients.protein.asparticAcid",
    aliases: ["aspartic_acid", "Aspartic acid", "asparticacid"],
    category: "amino_acid",
    parent: "protein",
  },
  cystine: {
    label: "Cystine",
    unit: "g",
    clinicalPath: "nutrients.protein.cystine",
    aliases: ["cystine", "Cystine"],
    category: "amino_acid",
    parent: "protein",
  },
  glutamic_acid: {
    label: "Glutamic Acid",
    unit: "g",
    clinicalPath: "nutrients.protein.glutamicAcid",
    aliases: ["glutamic_acid", "Glutamic acid", "glutamicacid"],
    category: "amino_acid",
    parent: "protein",
  },
  glutamine: {
    label: "Glutamine",
    unit: "g",
    clinicalPath: "nutrients.protein.glutamine",
    aliases: ["glutamine", "Glutamine"],
    category: "amino_acid",
    parent: "protein",
  },
  glycine: {
    label: "Glycine",
    unit: "g",
    clinicalPath: "nutrients.protein.glycine",
    aliases: ["glycine", "Glycine"],
    category: "amino_acid",
    parent: "protein",
  },
  histidine: {
    label: "Histidine",
    unit: "g",
    clinicalPath: "nutrients.protein.histidine",
    aliases: ["histidine", "Histidine"],
    category: "amino_acid",
    parent: "protein",
  },
  hydroxyproline: {
    label: "Hydroxyproline",
    unit: "g",
    clinicalPath: "nutrients.protein.hydroxyproline",
    aliases: ["hydroxyproline", "Hydroxyproline"],
    category: "amino_acid",
    parent: "protein",
  },
  isoleucine: {
    label: "Isoleucine",
    unit: "g",
    clinicalPath: "nutrients.protein.isoleucine",
    aliases: ["isoleucine", "Isoleucine"],
    category: "amino_acid",
    parent: "protein",
  },
  leucine: {
    label: "Leucine",
    unit: "g",
    clinicalPath: "nutrients.protein.leucine",
    aliases: ["leucine", "Leucine"],
    category: "amino_acid",
    parent: "protein",
  },
  lysine: {
    label: "Lysine",
    unit: "g",
    clinicalPath: "nutrients.protein.lysine",
    aliases: ["lysine", "Lysine"],
    category: "amino_acid",
    parent: "protein",
  },
  methionine: {
    label: "Methionine",
    unit: "g",
    clinicalPath: "nutrients.protein.methionine",
    aliases: ["methionine", "Methionine"],
    category: "amino_acid",
    parent: "protein",
  },
  phenylalanine: {
    label: "Phenylalanine",
    unit: "g",
    clinicalPath: "nutrients.protein.phenylalanine",
    aliases: ["phenylalanine", "Phenylalanine"],
    category: "amino_acid",
    parent: "protein",
  },
  proline: {
    label: "Proline",
    unit: "g",
    clinicalPath: "nutrients.protein.proline",
    aliases: ["proline", "Proline"],
    category: "amino_acid",
    parent: "protein",
  },
  serine: {
    label: "Serine",
    unit: "g",
    clinicalPath: "nutrients.protein.serine",
    aliases: ["serine", "Serine"],
    category: "amino_acid",
    parent: "protein",
  },
  threonine: {
    label: "Threonine",
    unit: "g",
    clinicalPath: "nutrients.protein.threonine",
    aliases: ["threonine", "Threonine"],
    category: "amino_acid",
    parent: "protein",
  },
  tryptophan: {
    label: "Tryptophan",
    unit: "g",
    clinicalPath: "nutrients.protein.tryptophan",
    aliases: ["tryptophan", "Tryptophan"],
    category: "amino_acid",
    parent: "protein",
  },
  tyrosine: {
    label: "Tyrosine",
    unit: "g",
    clinicalPath: "nutrients.protein.tyrosine",
    aliases: ["tyrosine", "Tyrosine"],
    category: "amino_acid",
    parent: "protein",
  },
  valine: {
    label: "Valine",
    unit: "g",
    clinicalPath: "nutrients.protein.valine",
    aliases: ["valine", "Valine"],
    category: "amino_acid",
    parent: "protein",
  },

  // --- FAT GROUP ---
  fat: {
    label: "Total Fat",
    unit: "g",
    clinicalPath: "nutrients.fat.total",
    aliases: [
      "fat",
      "Total lipid (fat)",
      "Total fat (NLEA)",
      "total fat",
      "FAT",
    ],
    category: "macro",
  },
  fat_saturated: {
    label: "Saturated Fat",
    unit: "g",
    clinicalPath: "nutrients.fat.saturated",
    aliases: [
      "fat_saturated",
      "Fatty acids, total saturated",
      "saturated-fat",
      "saturated fat",
    ],
    category: "macro",
    parent: "fat",
  },
  fat_trans: {
    label: "Trans Fat",
    unit: "g",
    clinicalPath: "nutrients.fat.trans",
    aliases: [
      "fat_trans",
      "Fatty acids, total trans",
      "trans-fat",
      "trans fat",
    ],
    category: "macro",
    parent: "fat",
  },
  fat_monounsaturated: {
    label: "Monounsaturated Fat",
    unit: "g",
    clinicalPath: "nutrients.fat.monounsaturated",
    aliases: [
      "fat_monounsaturated",
      "Fatty acids, total monounsaturated",
      "monounsaturated",
    ],
    category: "macro",
    parent: "fat",
  },
  fat_polyunsaturated: {
    label: "Polyunsaturated Fat",
    unit: "g",
    clinicalPath: "nutrients.fat.polyunsaturated",
    aliases: [
      "fat_polyunsaturated",
      "Fatty acids, total polyunsaturated",
      "polyunsaturated",
    ],
    category: "macro",
    parent: "fat",
  },
  omega3: {
    label: "Omega-3",
    unit: "g",
    clinicalPath: "nutrients.fat.omega3",
    aliases: [
      "omega3",
      "omega-3",
      "alpha-linolenic",
      "PUFA 18:3 n-3 c,c,c (ALA)",
      "PUFA 20:5 n-3 (EPA)",
      "PUFA 22:6 n-3 (DHA)",
    ],
    category: "macro",
    parent: "fat",
  },
  omega6: {
    label: "Omega-6",
    unit: "g",
    clinicalPath: "nutrients.fat.omega6",
    aliases: [
      "omega6",
      "omega-6",
      "linoleic",
      "PUFA 18:2 n-6 c,c",
      "PUFA 20:4 n-6",
    ],
    category: "macro",
    parent: "fat",
  },
  cholesterol: {
    label: "Cholesterol",
    unit: "mg",
    clinicalPath: "nutrients.fat.cholesterol",
    aliases: ["cholesterol", "Cholesterol"],
    category: "macro",
    parent: "fat",
  },

  // --- WATER ---
  water: {
    label: "Water",
    unit: "ml",
    clinicalPath: "nutrients.water",
    aliases: ["water", "Water"],
    category: "macro",
  },

  // --- VITAMINS ---
  vitamin_a: {
    label: "Vitamin A",
    unit: "mcg",
    clinicalPath: "nutrients.vitaminA",
    aliases: ["vitamin-a", "Vitamin A, RAE", "Vitamin A"],
    category: "vitamin",
  },
  vitamin_c: {
    label: "Vitamin C",
    unit: "mg",
    clinicalPath: "nutrients.vitaminC",
    aliases: [
      "vitamin-c",
      "Vitamin C, total ascorbic acid",
      "Vitamin C",
      "VITAMIN C",
    ],
    category: "vitamin",
  },
  vitamin_d: {
    label: "Vitamin D",
    unit: "mcg",
    clinicalPath: "nutrients.vitaminD",
    aliases: ["vitamin-d", "Vitamin D (D2 + D3)", "Vitamin D"],
    category: "vitamin",
  },
  vitamin_e: {
    label: "Vitamin E",
    unit: "mg",
    clinicalPath: "nutrients.vitaminE",
    aliases: ["vitamin-e", "Vitamin E (alpha-tocopherol)", "Vitamin E"],
    category: "vitamin",
  },
  vitamin_k: {
    label: "Vitamin K",
    unit: "mcg",
    clinicalPath: "nutrients.vitaminK",
    aliases: [
      "vitamin-k",
      "Vitamin K (phylloquinone)",
      "Vitamin K",
      "VITAMIN K",
    ],
    category: "vitamin",
  },
  thiamin: {
    label: "Thiamin (B1)",
    unit: "mg",
    clinicalPath: "nutrients.thiamin",
    aliases: ["thiamin", "Thiamin"],
    category: "vitamin",
  },
  riboflavin: {
    label: "Riboflavin (B2)",
    unit: "mg",
    clinicalPath: "nutrients.riboflavin",
    aliases: ["riboflavin", "Riboflavin"],
    category: "vitamin",
  },
  niacin: {
    label: "Niacin (B3)",
    unit: "mg",
    clinicalPath: "nutrients.niacin",
    aliases: ["niacin", "Niacin"],
    category: "vitamin",
  },
  vitamin_b6: {
    label: "Vitamin B6",
    unit: "mg",
    clinicalPath: "nutrients.vitaminB6",
    aliases: ["vitamin-b6", "Vitamin B-6"],
    category: "vitamin",
  },
  folate: {
    label: "Folate",
    unit: "mcg",
    clinicalPath: "nutrients.folate",
    aliases: ["folate", "folic-acid", "Folate, total"],
    category: "vitamin",
  },
  vitamin_b12: {
    label: "Vitamin B12",
    unit: "mcg",
    clinicalPath: "nutrients.vitaminB12",
    aliases: ["vitamin-b12", "Vitamin B-12"],
    category: "vitamin",
  },
  choline: {
    label: "Choline",
    unit: "g",
    clinicalPath: "nutrients.choline",
    aliases: ["choline", "Choline, total"],
    category: "vitamin",
  },
  pantothenic_acid: {
    label: "Pantothenic Acid",
    unit: "mg",
    clinicalPath: "nutrients.pantothenicAcid",
    aliases: ["pantothenic-acid", "Pantothenic acid"],
    category: "vitamin",
  },
  biotin: {
    label: "Biotin",
    unit: "mcg",
    clinicalPath: "nutrients.biotin",
    aliases: ["biotin", "Biotin"],
    category: "vitamin",
  },

  // --- MINERALS ---
  calcium: {
    label: "Calcium",
    unit: "mg",
    clinicalPath: "nutrients.calcium",
    aliases: ["calcium", "Calcium, Ca"],
    category: "mineral",
  },
  chloride: {
    label: "Chloride",
    unit: "g",
    clinicalPath: "nutrients.chloride",
    aliases: ["chloride", "Chloride, Cl"],
    category: "mineral",
  },
  chromium: {
    label: "Chromium",
    unit: "mcg",
    clinicalPath: "nutrients.chromium",
    aliases: ["chromium", "Chromium, Cr"],
    category: "mineral",
  },
  copper: {
    label: "Copper",
    unit: "mcg",
    clinicalPath: "nutrients.copper",
    aliases: ["copper", "Copper, Cu"],
    category: "mineral",
  },
  fluoride: {
    label: "Fluoride",
    unit: "mg",
    clinicalPath: "nutrients.fluoride",
    aliases: ["fluoride", "Fluoride, F"],
    category: "mineral",
  },
  iodine: {
    label: "Iodine",
    unit: "mcg",
    clinicalPath: "nutrients.iodine",
    aliases: ["iodine", "Iodine, I"],
    category: "mineral",
  },
  iron: {
    label: "Iron",
    unit: "mg",
    clinicalPath: "nutrients.iron",
    aliases: ["iron", "Iron, Fe"],
    category: "mineral",
  },
  magnesium: {
    label: "Magnesium",
    unit: "mg",
    clinicalPath: "nutrients.magnesium",
    aliases: ["magnesium", "Magnesium, Mg"],
    category: "mineral",
  },
  manganese: {
    label: "Manganese",
    unit: "mg",
    clinicalPath: "nutrients.manganese",
    aliases: ["manganese", "Manganese, Mn"],
    category: "mineral",
  },
  molybdenum: {
    label: "Molybdenum",
    unit: "mcg",
    clinicalPath: "nutrients.molybdenum",
    aliases: ["molybdenum", "Molybdenum, Mo"],
    category: "mineral",
  },
  phosphorus: {
    label: "Phosphorus",
    unit: "mg",
    clinicalPath: "nutrients.phosphorus",
    aliases: ["phosphorus", "Phosphorus, P"],
    category: "mineral",
  },
  potassium: {
    label: "Potassium",
    unit: "mg",
    clinicalPath: "nutrients.potassium",
    aliases: ["potassium", "Potassium, K"],
    category: "mineral",
  },
  selenium: {
    label: "Selenium",
    unit: "mcg",
    clinicalPath: "nutrients.selenium",
    aliases: ["selenium", "Selenium, Se"],
    category: "mineral",
  },
  sodium: {
    label: "Sodium",
    unit: "mg",
    clinicalPath: "nutrients.sodium",
    aliases: ["sodium", "Sodium, Na"],
    category: "mineral",
  },
  zinc: {
    label: "Zinc",
    unit: "mg",
    clinicalPath: "nutrients.zinc",
    aliases: ["zinc", "Zinc, Zn"],
    category: "mineral",
  },

  // --- OTHERS / SPECIFIC CAROTENOIDS ---
  beta_carotene: {
    label: "Beta-carotene",
    unit: "mcg",
    clinicalPath: "nutrients.vitaminA", // Often contributes to Vit A
    aliases: ["beta-carotene", "Carotene, beta", "Beta-carotene"],
    category: "vitamin",
  },
  lycopene: {
    label: "Lycopene",
    unit: "mcg",
    clinicalPath: "nutrients.other.lycopene",
    aliases: ["lycopene", "Lycopene"],
    category: "other",
  },
  lutein_zeaxanthin: {
    label: "Lutein + Zeaxanthin",
    unit: "mcg",
    clinicalPath: "nutrients.other.luteinZeaxanthin",
    aliases: [
      "lutein_zeaxanthin",
      "Lutein + zeaxanthin",
      "Lutein + Zeaxanthin",
    ],
    category: "other",
  },
} as const;

export type CanonicalNutrientKey = keyof typeof NUTRIENT_REGISTRY;

/**
 * Unified Nutrient Lookup/Normalization
 * Use this to map ANY nutrient name from ANY source to our canonical key.
 */
export function normalizeToCanonicalKey(
  name: string,
): CanonicalNutrientKey | undefined {
  const lowerName = name.toLowerCase().trim();

  // 1. Direct Alias Match
  for (const [key, metadata] of Object.entries(NUTRIENT_REGISTRY)) {
    if (
      key === lowerName ||
      metadata.aliases.some((a) => a.toLowerCase() === lowerName)
    ) {
      return key as CanonicalNutrientKey;
    }
  }

  // 2. Fuzzy/Partial Match for resilient mapping
  if (lowerName.includes("fiber")) return "fiber";
  if (lowerName.includes("protein")) return "protein";
  if (
    lowerName.includes("fat") &&
    !lowerName.includes("saturated") &&
    !lowerName.includes("trans")
  )
    return "fat";
  if (
    lowerName.includes("sugar") &&
    !lowerName.includes("added") &&
    !lowerName.includes("alcohol")
  )
    return "sugar";
  if (lowerName.includes("carbohydrate")) return "carbohydrate";

  return undefined;
}

/**
 * Unit conversion factors to base (g for mass, ml for volume).
 */
export const BASE_CONVERSIONS: Record<string, number> = {
  // Mass to grams
  g: 1,
  gram: 1,
  grams: 1,
  mg: 0.001,
  milligram: 0.001,
  milligrams: 0.001,
  mcg: 0.000001,
  microgram: 0.000001,
  micrograms: 0.000001,
  µg: 0.000001,
  kg: 1000,
  kilogram: 1000,
  // Other mass units (to grams)
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.592,
  pound: 453.592,
  pounds: 453.592,
  // Volume to milliliters
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  // Approximate volume to mass (for water-based items)
  cup: 236.588,
  tbsp: 14.787,
  tsp: 4.929,
};

/**
 * Converts a nutrient value between units.
 */
export function convertNutrientValue(
  value: number | null,
  fromUnit: string | null,
  toUnit: string | null,
): number | null {
  if (value === null || !fromUnit || !toUnit) return value;
  if (fromUnit === toUnit) return value;

  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();

  const fromFactor = BASE_CONVERSIONS[from];
  const toFactor = BASE_CONVERSIONS[to];

  if (fromFactor === undefined || toFactor === undefined) {
    // Cannot convert across different types (e.g. mass to volume) without density,
    // or unknown units. Return original value as best effort.
    return value;
  }

  // Convert from source to base, then base to target
  const baseValue = value * fromFactor;
  return baseValue / toFactor;
}

/**
 * Registry Helper: Get clinical recommended value from DRIMetrics
 */
export function getClinicalValue(
  metrics: DRIMetrics,
  key: CanonicalNutrientKey,
): number | null {
  const metadata = NUTRIENT_REGISTRY[key];
  if (!metadata || !("clinicalPath" in metadata)) return null;

  const path = (metadata as unknown as NutrientMetadata).clinicalPath;
  if (!path) return null;

  // Direct path for tee
  if (path === "tee") return metrics.tee;

  // Nested path lookup
  const parts = path.split(".");
  let current: unknown = metrics;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return (current as { recommended: number })?.recommended ?? null;
}
