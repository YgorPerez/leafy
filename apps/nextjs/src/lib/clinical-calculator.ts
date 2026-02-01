import { z } from "zod";

export const UserProfileSchema = z.object({
  sex: z.enum(["male", "female"]),
  age: z.number().describe("Years"),
  weight: z.number().describe("kg"),
  height: z.number().describe("cm"),
  activityLevel: z.enum(["sedentary", "low", "active", "very_active"]),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UnitSchema = z.enum([
  "mg",
  "g",
  "mcg",
  "L",
  "ml",
  "kcal",
  "IU",
  "NA",
]);
export type Unit = z.infer<typeof UnitSchema>;

export const NutrientValueSchema = z.object({
  recommended: z.number(),
  unit: UnitSchema,
  ul: z
    .union([z.number(), z.string()])
    .optional()
    .describe("Tolerable Upper Intake Level, string for 'ND'"),
  min: z.number().optional(),
  max: z.number().optional(),
  note: z.string().optional(),
});

export type NutrientValue = z.infer<typeof NutrientValueSchema>;

/**
 * Simplified nutrient value reference for UI editing
 */
export type NutrientValueRef = {
  recommended: number;
  unit: string;
};

export const DRIMetricsSchema = z.object({
  bmr: z.number(),
  tee: z.number(),
  bmi: z.number(),
  weight: z.number(),
  nutrients: z.object({
    // Macronutrients
    carbohydrate: z.object({
      total: NutrientValueSchema,
      starch: NutrientValueSchema,
      fiber: z.object({
        total: NutrientValueSchema,
        soluble: NutrientValueSchema,
        insoluble: NutrientValueSchema,
      }),
      sugar: z.object({
        total: NutrientValueSchema,
        added: NutrientValueSchema,
        alcohol: NutrientValueSchema,
        // Specific Sugars
        fructose: NutrientValueSchema,
        sucrose: NutrientValueSchema,
        lactose: NutrientValueSchema,
        glucose: NutrientValueSchema,
        maltose: NutrientValueSchema,
        galactose: NutrientValueSchema,
      }),
    }),

    protein: z.object({
      total: NutrientValueSchema,
      // Amino Acids
      alanine: NutrientValueSchema,
      arginine: NutrientValueSchema,
      asparticAcid: NutrientValueSchema,
      cystine: NutrientValueSchema,
      glutamicAcid: NutrientValueSchema,
      glutamine: NutrientValueSchema,
      glycine: NutrientValueSchema,
      histidine: NutrientValueSchema,
      hydroxyproline: NutrientValueSchema,
      isoleucine: NutrientValueSchema,
      leucine: NutrientValueSchema,
      lysine: NutrientValueSchema,
      methionine: NutrientValueSchema,
      phenylalanine: NutrientValueSchema,
      proline: NutrientValueSchema,
      serine: NutrientValueSchema,
      threonine: NutrientValueSchema,
      tryptophan: NutrientValueSchema,
      tyrosine: NutrientValueSchema,
      valine: NutrientValueSchema,
    }),

    fat: z.object({
      total: NutrientValueSchema,
      saturated: NutrientValueSchema,
      trans: NutrientValueSchema,
      monounsaturated: NutrientValueSchema,
      polyunsaturated: NutrientValueSchema,
      omega3: NutrientValueSchema,
      omega6: NutrientValueSchema,
      cholesterol: NutrientValueSchema,
    }),
    water: NutrientValueSchema,

    // Vitamins
    vitaminA: NutrientValueSchema,
    vitaminC: NutrientValueSchema,
    vitaminD: NutrientValueSchema,
    vitaminE: NutrientValueSchema,
    vitaminK: NutrientValueSchema,
    thiamin: NutrientValueSchema,
    riboflavin: NutrientValueSchema,
    niacin: NutrientValueSchema,
    vitaminB6: NutrientValueSchema,
    folate: NutrientValueSchema,
    vitaminB12: NutrientValueSchema,
    choline: NutrientValueSchema,
    pantothenicAcid: NutrientValueSchema,
    biotin: NutrientValueSchema,
    carotenoids: NutrientValueSchema,

    // Essential Minerals
    calcium: NutrientValueSchema,
    chloride: NutrientValueSchema,
    chromium: NutrientValueSchema,
    copper: NutrientValueSchema,
    fluoride: NutrientValueSchema,
    iodine: NutrientValueSchema,
    iron: NutrientValueSchema,
    magnesium: NutrientValueSchema,
    manganese: NutrientValueSchema,
    molybdenum: NutrientValueSchema,
    phosphorus: NutrientValueSchema,
    potassium: NutrientValueSchema,
    selenium: NutrientValueSchema,
    sodium: NutrientValueSchema,
    zinc: NutrientValueSchema,

    // Non-Essential Minerals
    arsenic: NutrientValueSchema,
    boron: NutrientValueSchema,
    nickel: NutrientValueSchema,
    silicon: NutrientValueSchema,
    sulfate: NutrientValueSchema,
    vanadium: NutrientValueSchema,
  }),
});

export type DRIMetrics = z.infer<typeof DRIMetricsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activity levels and their corresponding TEE (Total Energy Expenditure) factors.
 */
export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  low: 1.375,
  active: 1.55,
  very_active: 1.725,
} as const;

/**
 * Acceptable Macronutrient Distribution Ranges (AMDR) constants.
 */
const AMDR = {
  CARBS: { MIN: 0.45, MAX: 0.65 },
  FAT: { MIN: 0.2, MAX: 0.35 },
  PROTEIN: { BASE_RDA: 0.8, UPPER_LIMIT: 2.0 },
} as const;

/**
 * Energy conversion factors (kcal/gram).
 */
const ENERGY_FACTORS = {
  CARBS: 4,
  PROTEIN: 4,
  FAT: 9,
} as const;

/**
 * WHO/FAO/UNU Amino Acid requirement guidelines (mg/kg body weight).
 */
const AMINO_ACID_GUIDELINES = {
  CYSTINE: 4,
  HISTIDINE: 10,
  ISOLEUCINE: 20,
  LEUCINE: 39,
  LYSINE: 30,
  METHIONINE: 10,
  PHENYLALANINE: 25,
  THREONINE: 15,
  TRYPTOPHAN: 4,
  TYROSINE: 25,
  VALINE: 26,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Calculation Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates Dietary Reference Intakes (DRI) based on user profile.
 * Uses Mifflin-St Jeor equation for BMR and WHO/USDA guidelines for nutrients.
 */
export function calculateDRI(profile: UserProfile): DRIMetrics {
  const { sex, age, weight, height, activityLevel } = profile;
  const isMale = sex === "male";

  // 1. BMI: weight (kg) / height (m)^2
  const bmi = weight / Math.pow(height / 100, 2);

  // 2. BMR - Mifflin-St Jeor Equation
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (isMale) {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 3. TEE - Total Energy Expenditure
  const tee = bmr * (ACTIVITY_FACTORS[activityLevel] || 1.2);

  // 4. Macronutrient Ranges (based on AMDR)
  const carbMin = (tee * AMDR.CARBS.MIN) / ENERGY_FACTORS.CARBS;
  const carbMax = (tee * AMDR.CARBS.MAX) / ENERGY_FACTORS.CARBS;
  const fatMin = (tee * AMDR.FAT.MIN) / ENERGY_FACTORS.FAT;
  const fatMax = (tee * AMDR.FAT.MAX) / ENERGY_FACTORS.FAT;
  const proteinRDA = weight * AMDR.PROTEIN.BASE_RDA;

  // 5. Water (AI) - converted to ml
  const water = isMale ? 3700 : 2700;

  // Helper for amino acid calculation (mg/kg body weight -> g/day)
  const calculateAA = (mgPerKg: number) =>
    Math.round(((mgPerKg * weight) / 1000) * 10) / 10;

  return {
    bmr: Math.round(bmr),
    tee: Math.round(tee),
    bmi: Number(bmi.toFixed(1)),
    weight: weight,
    nutrients: {
      // Macronutrients
      carbohydrate: {
        total: {
          recommended: Math.round(carbMin),
          min: Math.round(carbMin),
          max: Math.round(carbMax),
          unit: "g",
        },
        starch: { recommended: 0, unit: "g", note: "Complex carbs preferred" },
        fiber: {
          total: { recommended: isMale ? 38 : 25, unit: "g" },
          soluble: { recommended: isMale ? 8 : 6, unit: "g" },
          insoluble: { recommended: isMale ? 30 : 19, unit: "g" },
        },
        sugar: {
          total: {
            recommended: Math.round((tee * 0.1) / ENERGY_FACTORS.CARBS), // WHO < 10%
            unit: "g",
            note: "Limit intake",
          },
          added: {
            recommended: Math.round((tee * 0.05) / ENERGY_FACTORS.CARBS), // WHO < 5%
            unit: "g",
            note: "Limit to <5-10% of total calories",
          },
          alcohol: { recommended: 0, unit: "g", note: "Limit if sensitive" },
          fructose: { recommended: 0, unit: "g" },
          sucrose: { recommended: 0, unit: "g" },
          lactose: { recommended: 0, unit: "g" },
          glucose: { recommended: 0, unit: "g" },
          maltose: { recommended: 0, unit: "g" },
          galactose: { recommended: 0, unit: "g" },
        },
      },

      protein: {
        total: {
          recommended: Math.round(proteinRDA),
          min: Math.round(proteinRDA),
          max: Math.round(weight * AMDR.PROTEIN.UPPER_LIMIT),
          unit: "g",
        },
        alanine: { recommended: 0, unit: "g" },
        arginine: { recommended: 0, unit: "g" },
        asparticAcid: { recommended: 0, unit: "g" },
        cystine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.CYSTINE),
          unit: "g",
          note: "TSAA (Met+Cys) ~15mg/kg",
        },
        glutamicAcid: { recommended: 0, unit: "g" },
        glutamine: { recommended: 0, unit: "g" },
        glycine: { recommended: 0, unit: "g" },
        histidine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.HISTIDINE),
          unit: "g",
        },
        hydroxyproline: { recommended: 0, unit: "g" },
        isoleucine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.ISOLEUCINE),
          unit: "g",
        },
        leucine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.LEUCINE),
          unit: "g",
        },
        lysine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.LYSINE),
          unit: "g",
        },
        methionine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.METHIONINE),
          unit: "g",
          note: "~10-15mg/kg",
        },
        phenylalanine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.PHENYLALANINE),
          unit: "g",
          note: "Phe+Tyr ~25mg/kg",
        },
        proline: { recommended: 0, unit: "g" },
        serine: { recommended: 0, unit: "g" },
        threonine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.THREONINE),
          unit: "g",
        },
        tryptophan: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.TRYPTOPHAN),
          unit: "g",
        },
        tyrosine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.TYROSINE),
          unit: "g",
          note: "Phe+Tyr total",
        },
        valine: {
          recommended: calculateAA(AMINO_ACID_GUIDELINES.VALINE),
          unit: "g",
        },
      },

      fat: {
        total: {
          recommended: Math.round(fatMin),
          min: Math.round(fatMin),
          max: Math.round(fatMax),
          unit: "g",
        },
        saturated: {
          recommended: Math.round((tee * 0.1) / ENERGY_FACTORS.FAT),
          unit: "g",
          note: "Limit to <10% calories",
        },
        trans: {
          recommended: Math.round((tee * 0.01) / ENERGY_FACTORS.FAT),
          unit: "g",
          note: "As low as possible (<1%)",
        },
        monounsaturated: {
          recommended: Math.round((tee * 0.15) / ENERGY_FACTORS.FAT),
          unit: "g",
        },
        polyunsaturated: {
          recommended: Math.round((tee * 0.1) / ENERGY_FACTORS.FAT),
          unit: "g",
        },
        omega3: { recommended: isMale ? 1.6 : 1.1, unit: "g" },
        omega6: { recommended: isMale ? 17 : 12, unit: "g" },
        cholesterol: {
          recommended: 300,
          unit: "mg",
          note: "As low as possible",
        },
      },
      water: { recommended: water, unit: "ml" },

      // Vitamins
      vitaminA: { recommended: isMale ? 900 : 700, unit: "mcg", ul: 3000 },
      vitaminC: { recommended: isMale ? 90 : 75, unit: "mg", ul: 2000 },
      vitaminD: { recommended: 15, unit: "mcg", ul: 100 },
      vitaminE: { recommended: 15, unit: "mg", ul: 1000 },
      vitaminK: { recommended: isMale ? 120 : 90, unit: "mcg", ul: "ND" },
      thiamin: { recommended: isMale ? 1.2 : 1.1, unit: "mg", ul: "ND" },
      riboflavin: { recommended: isMale ? 1.3 : 1.1, unit: "mg", ul: "ND" },
      niacin: { recommended: isMale ? 16 : 14, unit: "mg", ul: 35 },
      vitaminB6: {
        recommended: age > 50 ? (isMale ? 1.7 : 1.5) : 1.3,
        unit: "mg",
        ul: 100,
      },
      folate: { recommended: 400, unit: "mcg", ul: 1000 },
      vitaminB12: { recommended: 2.4, unit: "mcg", ul: "ND" },
      choline: { recommended: isMale ? 0.55 : 0.425, unit: "g", ul: 3.5 },
      pantothenicAcid: { recommended: 5, unit: "mg", ul: "ND" },
      biotin: { recommended: 30, unit: "mcg", ul: "ND" },
      carotenoids: {
        recommended: 0,
        unit: "NA",
        ul: "ND",
        note: "Not Available",
      },

      // Essential Minerals
      calcium: { recommended: age > 50 ? 1200 : 1000, unit: "mg", ul: 2500 },
      chloride: { recommended: 2.3, unit: "g", ul: 3.6 },
      chromium: { recommended: isMale ? 35 : 25, unit: "mcg", ul: "ND" },
      copper: { recommended: 900, unit: "mcg", ul: 10000 },
      fluoride: { recommended: isMale ? 4 : 3, unit: "mg", ul: 10 },
      iodine: { recommended: 150, unit: "mcg", ul: 1100 },
      iron: { recommended: isMale ? 8 : age > 50 ? 8 : 18, unit: "mg", ul: 45 },
      magnesium: {
        recommended: isMale ? (age > 30 ? 420 : 400) : age > 30 ? 320 : 310,
        unit: "mg",
        ul: 350,
      },
      manganese: { recommended: isMale ? 2.3 : 1.8, unit: "mg", ul: 11 },
      molybdenum: { recommended: 45, unit: "mcg", ul: 2000 },
      phosphorus: { recommended: 700, unit: "mg", ul: 4000 },
      potassium: { recommended: isMale ? 3400 : 2600, unit: "mg", ul: "ND" },
      selenium: { recommended: 55, unit: "mcg", ul: 400 },
      sodium: { recommended: 1500, unit: "mg", ul: 2300 },
      zinc: { recommended: isMale ? 11 : 8, unit: "mg", ul: 40 },

      // Non-Essential Minerals
      arsenic: { recommended: 0, unit: "NA", ul: "ND", note: "Not Available" },
      boron: { recommended: 0, unit: "mg", ul: 20 },
      nickel: { recommended: 0, unit: "mg", ul: 1 },
      silicon: { recommended: 0, unit: "NA", ul: "ND", note: "Not Available" },
      sulfate: { recommended: 0, unit: "NA", ul: "ND", note: "Not Available" },
      vanadium: { recommended: 0, unit: "mg", ul: 1.8 },
    },
  };
}
