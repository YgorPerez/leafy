"use client";

import { useOnboardingStore } from "~/app/_store/onboarding-store";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { StepContainer } from "../step-container";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  isLast?: boolean;
  isPending?: boolean;
}

const ACTIVITY_LEVELS = [
  {
    value: "sedentary" as const,
    label: "Sedentary",
    steps: "~3,000-4,000 steps/day",
    description:
      "Desk job, driving everywhere, minimal walking. Most of the day sitting or lying down.",
  },
  {
    value: "low" as const,
    label: "Lightly Active",
    steps: "~5,000-7,000 steps/day",
    description:
      "Teacher, salesperson, some walking. Light chores, occasional errands on foot.",
  },
  {
    value: "active" as const,
    label: "Moderately Active",
    steps: "~8,000-10,000 steps/day",
    description:
      'Waiter, nurse, walking commute, "happy feet" fidgeters, hyperactive types who can\'t sit still.',
  },
  {
    value: "very_active" as const,
    label: "Very Active",
    steps: "~12,000+ steps/day",
    description:
      "Construction, farming, courier, athlete. On your feet and moving most of the day.",
  },
];

const EXPERIENCE_LEVELS = [
  {
    value: "beginner" as const,
    label: "Beginner",
    description: "Less than 1 year of consistent training",
  },
  {
    value: "intermediate" as const,
    label: "Intermediate",
    description: "1-3 years of consistent training",
  },
  {
    value: "advanced" as const,
    label: "Advanced",
    description: "3+ years of consistent training",
  },
];

export function ActivityLevel({
  onNext,
  onBack,
  isLast,
  isPending,
}: StepProps) {
  const store = useOnboardingStore();

  return (
    <StepContainer
      title="Activity Level"
      description="Your daily movement and exercise frequency determine your calorie needs. Think about your non-exercise activity (NEAT)."
      onNext={onNext}
      onBack={onBack}
      isLast={isLast}
      isPending={isPending}
    >
      <div className="space-y-2">
        <Label>Daily Movement (Non-Exercise)</Label>
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITY_LEVELS.map((level) => {
            const isSelected = store.activityLevel === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  store.updateFields({
                    activityLevel: level.value,
                  })
                }
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <span className="text-sm font-semibold">{level.label}</span>
                <span className="text-xs font-medium text-green-400">
                  {level.steps}
                </span>
                <span className="text-muted-foreground text-xs">
                  {level.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exercise Frequency</Label>
          <span className="text-sm font-medium">
            {store.exerciseFrequency} days/week
          </span>
        </div>
        <Slider
          value={[store.exerciseFrequency]}
          onValueChange={(v) =>
            store.updateFields({ exerciseFrequency: v[0]! })
          }
          min={0}
          max={7}
          step={1}
          recommendedMin={3}
          recommendedMax={5}
        />
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>0</span>
          <span>3-5 (recommended)</span>
          <span>7</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Training Experience</Label>
        <div className="grid grid-cols-3 gap-3">
          {EXPERIENCE_LEVELS.map((level) => {
            const isSelected = store.trainingExperience === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  store.updateFields({
                    trainingExperience: level.value,
                  })
                }
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <span className="text-sm font-semibold">{level.label}</span>
                <span className="text-muted-foreground text-center text-xs">
                  {level.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </StepContainer>
  );
}
