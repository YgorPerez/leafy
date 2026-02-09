import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OnboardingState {
  // Navigation
  currentStep: number;
  completedSteps: number[];

  // Step 1: Units
  unitSystem: "metric" | "imperial";

  // Step 2: Physical
  birthDate: string;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  bodyFatPercent: number | null;

  // Step 3: Goal
  goalType: "lose" | "maintain" | "gain" | null;
  targetWeightKg: number | null;

  // Step 4: Rate of progress
  rateOfChange: number;

  // Step 5: Metabolism seeding
  intakeKnowledge: "none" | "rough" | "precise";
  weightTrend: "losing" | "stable" | "gaining";
  highestWeightKg: number | null;

  // Step 6: Biofeedback
  menstrualTracking: boolean;
  sleepQuality: "poor" | "fair" | "good" | "excellent";

  // Step 7: Training & supplements
  trainingExperience: "beginner" | "intermediate" | "advanced";

  // Step 8: Activity level
  activityLevel: "sedentary" | "low" | "active" | "very_active";
  exerciseFrequency: number;

  // Step 9: Dietary preferences
  dietType:
    | "standard"
    | "vegetarian"
    | "vegan"
    | "keto"
    | "low_fat"
    | "low_carb";
  proteinTarget: number;
  macroDistribution: {
    carbPercent: number;
    proteinPercent: number;
    fatPercent: number;
  };

  // Step 10: Calorie shifting & logistics
  calorieShiftType: "uniform" | "manual" | "training_based";
  dayConfig: Record<string, "high" | "low" | "normal">;
  highDayPercent: number;
  lowDayPercent: number;
  checkInDay:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

  // Actions
  setStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  updateFields: (fields: Partial<OnboardingState>) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  currentStep: 0,
  completedSteps: [] as number[],
  unitSystem: "metric" as const,
  birthDate: "",
  sex: "male" as const,
  heightCm: 170,
  weightKg: 70,
  bodyFatPercent: null,
  goalType: null,
  targetWeightKg: null,
  rateOfChange: 0.5,
  intakeKnowledge: "none" as const,
  weightTrend: "stable" as const,
  highestWeightKg: null,
  menstrualTracking: false,
  sleepQuality: "good" as const,
  trainingExperience: "intermediate" as const,

  activityLevel: "sedentary" as const,
  exerciseFrequency: 3,
  dietType: "standard" as const,
  proteinTarget: 1.6,
  macroDistribution: {
    carbPercent: 45,
    proteinPercent: 25,
    fatPercent: 30,
  },
  calorieShiftType: "uniform" as const,
  dayConfig: {} as Record<string, "high" | "low" | "normal">,
  highDayPercent: 115,
  lowDayPercent: 85,
  checkInDay: "monday" as const,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setStep: (step) => set({ currentStep: step }),
      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),
      updateFields: (fields) => set(fields),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
