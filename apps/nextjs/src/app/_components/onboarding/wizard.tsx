"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Apple,
  CalendarDays,
  CheckCircle,
  Flame,
  Globe,
  HeartPulse,
  History,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useOnboardingStore } from "~/app/_store/onboarding-store";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";
import { ActivityLevel } from "./steps/activity-level";
import { Biofeedback } from "./steps/biofeedback";
import { CalorieShifting } from "./steps/calorie-shifting";
import { Dietary } from "./steps/dietary";
import { GoalSetting } from "./steps/goal-setting";
import { MetabolismSeeding } from "./steps/metabolism-seeding";
import { Physical } from "./steps/physical";
import { RateOfProgress } from "./steps/rate-of-progress";
import { Review } from "./steps/review";
import { UnitPreferences } from "./steps/unit-preferences";

const STEPS = [
  {
    component: UnitPreferences,
    title: "Units",
    icon: Globe,
  },
  { component: Physical, title: "You", icon: User },
  { component: GoalSetting, title: "Goals", icon: Target },
  {
    component: RateOfProgress,
    title: "Pace",
    icon: TrendingUp,
  },
  {
    component: MetabolismSeeding,
    title: "History",
    icon: History,
  },
  {
    component: Biofeedback,
    title: "Body",
    icon: HeartPulse,
  },

  {
    component: ActivityLevel,
    title: "Activity",
    icon: Flame,
  },
  { component: Dietary, title: "Diet", icon: Apple },
  {
    component: CalorieShifting,
    title: "Schedule",
    icon: CalendarDays,
  },
  {
    component: Review,
    title: "Review",
    icon: CheckCircle,
  },
];

export function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter();
  const store = useOnboardingStore();
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const totalSteps = STEPS.length;
  const progressValue = ((store.currentStep + 1) / totalSteps) * 100;

  const completeMutation = api.food.completeOnboarding.useMutation({
    onSuccess: () => {
      store.reset();
      toast.success("Welcome to LeafyLog!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onNext = useCallback(() => {
    store.markStepComplete(store.currentStep);
    if (store.currentStep < totalSteps - 1) {
      setDirection("forward");
      setAnimKey((k) => k + 1);
      store.setStep(store.currentStep + 1);
    }
  }, [store, totalSteps]);

  const onBack = useCallback(() => {
    if (store.currentStep > 0) {
      setDirection("backward");
      setAnimKey((k) => k + 1);
      store.setStep(store.currentStep - 1);
    }
  }, [store]);

  const onComplete = useCallback(() => {
    store.markStepComplete(store.currentStep);
    completeMutation.mutate({
      unitSystem: store.unitSystem,
      displayName: userName,
      sex: store.sex,
      birthDate: new Date(store.birthDate),
      heightCm: store.heightCm,
      weightKg: store.weightKg,
      bodyFatPercent: store.bodyFatPercent,
      goalType: store.goalType!,
      targetWeightKg: store.targetWeightKg ?? store.weightKg,
      rateOfChange: store.rateOfChange,
      intakeKnowledge: store.intakeKnowledge,
      weightTrend: store.weightTrend,
      highestWeightKg: store.highestWeightKg ?? store.weightKg,
      menstrualTracking: store.menstrualTracking,
      sleepQuality: store.sleepQuality,
      trainingExperience: store.trainingExperience,

      activityLevel: store.activityLevel,
      exerciseFrequency: store.exerciseFrequency,
      dietType: store.dietType,
      proteinTarget: store.proteinTarget,
      macroDistribution: store.macroDistribution,
      calorieShiftType: store.calorieShiftType,
      dayConfig: store.dayConfig,
      highDayPercent: store.highDayPercent,
      lowDayPercent: store.lowDayPercent,
      checkInDay: store.checkInDay,
    });
  }, [store, userName, completeMutation]);

  const StepComponent = STEPS[store.currentStep]!.component;
  const isLast = store.currentStep === totalSteps - 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-start px-4 py-8">
      <div className="mb-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Leafy <span className="text-primary">Log</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Step {store.currentStep + 1} of {totalSteps}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 w-full max-w-lg">
        <Progress value={progressValue} className="h-2" />
        {/* Step dots */}
        <div className="mt-3 flex justify-between px-1">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === store.currentStep;
            const isComplete = store.completedSteps.includes(i);
            return (
              <div
                key={i}
                className={`flex flex-col items-center transition-colors ${
                  isActive
                    ? "text-primary"
                    : isComplete
                      ? "text-primary/60"
                      : "text-muted-foreground/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content with animation */}
      <div
        key={animKey}
        className={`animate-in fill-mode-forwards w-full max-w-lg duration-300 ${
          direction === "forward"
            ? "fade-in slide-in-from-right-8"
            : "fade-in slide-in-from-left-8"
        }`}
      >
        <StepComponent
          onNext={isLast ? onComplete : onNext}
          onBack={store.currentStep > 0 ? onBack : undefined}
          isLast={isLast}
          isPending={completeMutation.isPending}
        />
      </div>
    </div>
  );
}
