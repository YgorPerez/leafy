import { z } from "zod";

/**
 * Widmark r-factor: ratio of body water to total body weight.
 */
const WIDMARK_R = {
  male: 0.68,
  female: 0.55,
} as const;

/**
 * Average alcohol elimination rate (%BAC per hour).
 */
const ELIMINATION_RATE = 0.015;

/**
 * Grams of pure ethanol in one US standard drink.
 */
export const STANDARD_DRINK_GRAMS = 14;

export const BACInputSchema = z.object({
  alcoholGrams: z.number().min(0),
  bodyWeightKg: z.number().positive(),
  sex: z.enum(["male", "female"]),
  hoursElapsed: z.number().min(0),
});

export type BACInput = z.infer<typeof BACInputSchema>;

export interface BACResult {
  bac: number;
  standardDrinks: number;
  timeToSober: number;
  impairmentLevel: "none" | "mild" | "moderate" | "significant" | "severe" | "dangerous";
  disclaimer: string;
}

function classifyImpairment(bac: number): BACResult["impairmentLevel"] {
  if (bac <= 0) return "none";
  if (bac < 0.03) return "mild";
  if (bac < 0.06) return "moderate";
  if (bac < 0.1) return "significant";
  if (bac < 0.2) return "severe";
  return "dangerous";
}

const DISCLAIMER =
  "This is a rough estimate for informational purposes only. " +
  "Actual BAC depends on many factors including food intake, metabolism, " +
  "medications, and individual variation. Never drive under the influence.";

/**
 * Calculate estimated Blood Alcohol Content using the Widmark formula.
 *
 * BAC = (alcohol_grams / (body_weight_grams * r)) * 100 - (elimination_rate * hours)
 */
export function calculateBAC(input: BACInput): BACResult {
  const { alcoholGrams, bodyWeightKg, sex, hoursElapsed } = input;

  const r = WIDMARK_R[sex];
  const bodyWeightGrams = bodyWeightKg * 1000;

  const rawBAC = (alcoholGrams / (bodyWeightGrams * r)) * 100;
  const elimination = ELIMINATION_RATE * hoursElapsed;
  const bac = Math.max(0, rawBAC - elimination);

  const standardDrinks = alcoholGrams / STANDARD_DRINK_GRAMS;
  const timeToSober = bac > 0 ? bac / ELIMINATION_RATE : 0;

  return {
    bac: Number(bac.toFixed(4)),
    standardDrinks: Number(standardDrinks.toFixed(1)),
    timeToSober: Number(timeToSober.toFixed(1)),
    impairmentLevel: classifyImpairment(bac),
    disclaimer: DISCLAIMER,
  };
}
