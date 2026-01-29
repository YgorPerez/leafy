export type UserProfile = {
  sex: "male" | "female";
  age: number; // Years
  weight: number; // kg
  height: number; // cm
  activityLevel: "sedentary" | "low" | "active" | "very_active";
};

export type NutrientValue = {
  recommended: number;
  unit: string;
  ul?: number | string; // Tolerable Upper Intake Level, string for "ND"
  min?: number;
  max?: number;
  note?: string;
};

export type DRIMetrics = {
  bmr: number;
  tee: number;
  bmi: number;
  nutrients: {
    // Macronutrients
    carbohydrate: NutrientValue;
    fiber: NutrientValue;
    protein: NutrientValue;
    fat: NutrientValue;
    saturatedFat: NutrientValue;
    transFat: NutrientValue;
    alphaLinolenicAcid: NutrientValue;
    linoleicAcid: NutrientValue;
    cholesterol: NutrientValue;
    water: NutrientValue;

    // Vitamins
    vitaminA: NutrientValue;
    vitaminC: NutrientValue;
    vitaminD: NutrientValue;
    vitaminE: NutrientValue;
    vitaminK: NutrientValue;
    thiamin: NutrientValue;
    riboflavin: NutrientValue;
    niacin: NutrientValue;
    vitaminB6: NutrientValue;
    folate: NutrientValue;
    vitaminB12: NutrientValue;
    choline: NutrientValue;
    pantothenicAcid: NutrientValue;
    biotin: NutrientValue;
    carotenoids: NutrientValue;

    // Essential Minerals
    calcium: NutrientValue;
    chloride: NutrientValue;
    chromium: NutrientValue;
    copper: NutrientValue;
    fluoride: NutrientValue;
    iodine: NutrientValue;
    iron: NutrientValue;
    magnesium: NutrientValue;
    manganese: NutrientValue;
    molybdenum: NutrientValue;
    phosphorus: NutrientValue;
    potassium: NutrientValue;
    selenium: NutrientValue;
    sodium: NutrientValue;
    zinc: NutrientValue;

    // Non-Essential Minerals
    arsenic: NutrientValue;
    boron: NutrientValue;
    nickel: NutrientValue;
    silicon: NutrientValue;
    sulfate: NutrientValue;
    vanadium: NutrientValue;
  };
};

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  low: 1.375,
  active: 1.55,
  very_active: 1.725,
};

export function calculateDRI(profile: UserProfile): DRIMetrics {
  const { sex, age, weight, height, activityLevel } = profile;
  const isMale = sex === "male";

  // 1. BMI
  // weight (kg) / height (m)^2
  const bmi = weight / Math.pow(height / 100, 2);

  // 2. BMR - Mifflin-St Jeor
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (isMale) {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 3. TEE
  const tee = bmr * (ACTIVITY_FACTORS[activityLevel] || 1.2);

  // Macronutrients (Ranges based on AMDR: Carbs 45-65%, Fat 20-35%, Protein 10-35%)
  // 1g carb = 4kcal, 1g protein = 4kcal, 1g fat = 9kcal
  const carbMin = (tee * 0.45) / 4;
  const carbMax = (tee * 0.65) / 4;
  const fatMin = (tee * 0.2) / 9;
  const fatMax = (tee * 0.35) / 9;
  const proteinRDA = weight * 0.8; // Baseline RDA

  // Water (AI)
  const water = isMale ? 3.7 : 2.7;

  return {
    bmr: Math.round(bmr),
    tee: Math.round(tee),
    bmi: Number(bmi.toFixed(1)),
    nutrients: {
      // Macronutrients
      carbohydrate: {
        recommended: Math.round(carbMin),
        min: Math.round(carbMin),
        max: Math.round(carbMax),
        unit: "g",
      },
      fiber: { recommended: isMale ? 38 : 25, unit: "g" },
      protein: { recommended: Math.round(proteinRDA), unit: "g" },
      fat: {
        recommended: Math.round(fatMin),
        min: Math.round(fatMin),
        max: Math.round(fatMax),
        unit: "g",
      },
      saturatedFat: { recommended: 0, unit: "g", note: "As low as possible" },
      transFat: { recommended: 0, unit: "g", note: "As low as possible" },
      alphaLinolenicAcid: { recommended: isMale ? 1.6 : 1.1, unit: "g" },
      linoleicAcid: { recommended: isMale ? 17 : 12, unit: "g" },
      cholesterol: { recommended: 0, unit: "mg", note: "As low as possible" },
      water: { recommended: water, unit: "L" },

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
      phosphorus: { recommended: 0.7, unit: "g", ul: 4 },
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
