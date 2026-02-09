import { eq } from "drizzle-orm";
import { z } from "zod";

import { user, weightLog } from "@acme/db/schema";

import { protectedProcedure } from "../../trpc";

const OnboardingInputSchema = z.object({
  // Units
  unitSystem: z.enum(["metric", "imperial"]),
  displayName: z.string().optional(),

  // Physical
  sex: z.enum(["male", "female"]),
  birthDate: z.date(),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  bodyFatPercent: z.number().min(1).max(70).nullable(),

  // Goal
  goalType: z.enum(["lose", "maintain", "gain"]),
  targetWeightKg: z.number().min(20).max(500),
  rateOfChange: z.number().min(0.1).max(2.0),

  // Metabolism seeding
  intakeKnowledge: z.enum(["none", "rough", "precise"]),
  weightTrend: z.enum(["losing", "stable", "gaining"]),
  highestWeightKg: z.number().min(20).max(500),

  // Biofeedback
  menstrualTracking: z.boolean(),
  sleepQuality: z.enum(["poor", "fair", "good", "excellent"]),

  // Training
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"]),
  creatineUse: z.boolean(),

  // Activity
  activityLevel: z.enum(["sedentary", "low", "active", "very_active"]),
  exerciseFrequency: z.number().min(0).max(7),

  // Dietary
  dietType: z.enum(["standard", "vegetarian", "vegan", "keto", "paleo"]),
  proteinTarget: z.number().min(0.4).max(4.0),
  macroDistribution: z.object({
    carbPercent: z.number(),
    proteinPercent: z.number(),
    fatPercent: z.number(),
  }),

  // Calorie shifting
  calorieShiftType: z.enum(["uniform", "manual", "training_based"]),
  dayConfig: z
    .record(z.string(), z.enum(["high", "low", "normal"]))
    .optional(),
  highDayPercent: z.number().optional(),
  lowDayPercent: z.number().optional(),

  // Logistics
  checkInDay: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
});

export const completeOnboarding = protectedProcedure
  .input(OnboardingInputSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const onboardingProfile = {
      unitSystem: input.unitSystem,
      bodyFatPercent: input.bodyFatPercent ?? undefined,
      goalType: input.goalType,
      targetWeight: input.targetWeightKg,
      rateOfChange: input.rateOfChange,
      intakeKnowledge: input.intakeKnowledge,
      weightTrend: input.weightTrend,
      highestWeight: input.highestWeightKg,
      menstrualTracking: input.menstrualTracking,
      sleepQuality: input.sleepQuality,
      trainingExperience: input.trainingExperience,
      creatineUse: input.creatineUse,
      exerciseFrequency: input.exerciseFrequency,
      dietType: input.dietType,
      proteinTarget: input.proteinTarget,
      macroDistribution: input.macroDistribution,
      calorieShifting: {
        type: input.calorieShiftType,
        dayConfig: input.dayConfig,
        highDayPercent: input.highDayPercent,
        lowDayPercent: input.lowDayPercent,
      },
      checkInDay: input.checkInDay,
    };

    await ctx.db
      .update(user)
      .set({
        name: input.displayName || undefined,
        sex: input.sex,
        birthDate: input.birthDate,
        height: input.heightCm,
        weight: input.weightKg,
        activityLevel: input.activityLevel,
        onboardingProfile: onboardingProfile,
        onboardedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Create initial weight log entry
    const today = new Date().toISOString().split("T")[0]!;
    await ctx.db.insert(weightLog).values({
      userId,
      date: today,
      weight: input.weightKg,
    });

    return { success: true };
  });
