import { DIASS_DB } from "./data/diass-db";
import { normalizeToCanonicalKey } from "./nutrients/registry";

// FAO 2013 Reference Pattern for Adults (mg/g protein)
const FAO_ADULT_REFERENCE = {
  histidine: 15,
  isoleucine: 30,
  leucine: 59,
  lysine: 45,
  "methionine + cysteine": 22,
  "phenylalanine + tyrosine": 30,
  threonine: 23,
  tryptophan: 6,
  valine: 39,
};

// Mapping from our nutrient keys to reference pattern keys
// Assuming keys are already normalized via `normalizeToCanonicalKey`
// We need to map the canonical keys to the reference keys.
// Based on `nutrient-keys.ts`, we likely have "Histidine", "Isoleucine", etc.
// But `normalizeToCanonicalKey` probably lowercases them.

const AA_MAPPING: Record<string, keyof typeof FAO_ADULT_REFERENCE | string[]> =
  {
    histidine: "histidine",
    isoleucine: "isoleucine",
    leucine: "leucine",
    lysine: "lysine",
    methionine: ["methionine + cysteine"],
    cysteine: ["methionine + cysteine"],
    cystine: ["methionine + cysteine"], // Cystine is 2 cysteines, usually grouped
    phenylalanine: ["phenylalanine + tyrosine"],
    tyrosine: ["phenylalanine + tyrosine"],
    threonine: "threonine",
    tryptophan: "tryptophan",
    valine: "valine",
  };

export interface DiassResult {
  score: number; // 0-100+ (usually capped at 100 for some contexts but DIAAS allows >100)
  limitingAminoAcid: string | null;
  aminoAcidScores: Record<string, number>;
  totalProtein: number;
  reliability: "high" | "medium" | "low"; // Based on missing data
}

// ... existing code ...

export function calculateMealDIASS(
  foods: {
    name: string; // Add name to input
    protein: number;
    nutrients: Record<string, number>;
  }[],
): DiassResult {
  let totalProtein = 0;
  const totalAA: Record<string, number> = {}; // Sum of mg of each AA

  // Initialize totals
  for (const aa of Object.keys(FAO_ADULT_REFERENCE)) {
    totalAA[aa] = 0;
  }

  // 1. Sum up protein and amino acids
  for (const food of foods) {
    if (!food.protein || food.protein <= 0) continue;
    totalProtein += food.protein;

    // Find matching digestibility coefficients
    const normalizedName = food.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    let coefficients: Partial<Record<string, number>> = {};

    // Simple fuzzy match: check if DB key is contained in food name or vice versa
    // This is naive but a start.
    // Ideally we'd use a Levenshtein distance or similar.
    // For now, checks for exact substring match.

    const dbKey = Object.keys(DIASS_DB).find(
      (key) => normalizedName.includes(key) || key.includes(normalizedName),
    );

    if (dbKey) {
      const entry = DIASS_DB[dbKey];
      if (entry) {
        coefficients = entry.coefficients;
      }
    }

    for (const [key, value] of Object.entries(food.nutrients)) {
      const normalizedKey = normalizeToCanonicalKey(key);
      if (!normalizedKey) continue;

      // Map to reference pattern
      if (normalizedKey in AA_MAPPING) {
        const target = AA_MAPPING[normalizedKey];
        if (!target) continue;

        // Determine digestibility for this AA
        // If not found, default to 1.0 (no correction, i.e. AAS)
        // We need to map our canonical key (e.g. "histidine") to the DB key (e.g. "histidine")
        // The DB keys are lowercase full names. `normalizeToCanonicalKey` returns lowercase.
        // So `coefficients[normalizedKey]` should work if keys align.

        // Note: AA_MAPPING target is the Reference Pattern key.
        // We need the digestibility of the *individual* AA from the food.
        // The DB uses specific names like "lysine", "methionine", etc.
        // `normalizedKey` is likely "lysine", "methionine", etc.

        let digestibilty = 1.0;
        const potentialCoeff = coefficients[normalizedKey];
        if (typeof potentialCoeff === "number") {
          digestibilty = potentialCoeff;
        }

        const digestibleValue = value * digestibilty;

        if (Array.isArray(target)) {
          // It contributes to a group (e.g., Met + Cys)
          for (const t of target) {
            // For groups, we use the digestibility of the individual source AA
            // e.g. Met digest * Met content + Cys digest * Cys content
            // Here `value` is the content of ONE amino acid (e.g. Methionine)
            // So `digestibleValue` is correct for that component.
            // We add it to the group total.

            totalAA[t] = (totalAA[t] ?? 0) + digestibleValue * 1000;
          }
        } else {
          totalAA[target] = (totalAA[target] ?? 0) + digestibleValue * 1000;
        }
      }
    }
  }

  if (totalProtein === 0) {
    return {
      score: 0,
      limitingAminoAcid: null,
      aminoAcidScores: {},
      totalProtein: 0,
      reliability: "low",
    };
  }
  // ... remainder of function ...

  // 2. Calculate scores per AA
  const scores: Record<string, number> = {};
  let minScore = Infinity;
  let limitingAA = null;
  let missingCount = 0;

  for (const [aa, referenceMgPerG] of Object.entries(FAO_ADULT_REFERENCE)) {
    const totalMg = totalAA[aa] ?? 0;
    const mgPerGramProtein = totalMg / totalProtein;

    const score = (mgPerGramProtein / referenceMgPerG) * 100;
    scores[aa] = score;

    if (score < minScore) {
      minScore = score;
      limitingAA = aa;
    }

    if (totalMg === 0) {
      missingCount++;
    }
  }

  return {
    score: minScore === Infinity ? 0 : minScore,
    limitingAminoAcid: limitingAA,
    aminoAcidScores: scores,
    totalProtein,
    reliability:
      missingCount > 2 ? "low" : missingCount > 0 ? "medium" : "high",
  };
}
