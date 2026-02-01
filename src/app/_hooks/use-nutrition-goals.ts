"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { DRIMetrics } from "~/lib/clinical-calculator";
import {
  type CanonicalNutrientKey,
  getClinicalValue,
  NUTRIENT_REGISTRY,
} from "~/lib/nutrients/registry";
import { api } from "~/trpc/react";

export type Goal = {
  target?: number;
  min?: number;
  max?: number;
};

// Derived from Registry
export const PARENT_MAP: Record<string, string> = {};
export const HIERARCHY: Record<string, string[]> = {};

(Object.entries(NUTRIENT_REGISTRY) as [CanonicalNutrientKey, any][]).forEach(
  ([key, meta]) => {
    if (meta.parent) {
      PARENT_MAP[key] = meta.parent;
      if (!HIERARCHY[meta.parent]) HIERARCHY[meta.parent] = [];
      HIERARCHY[meta.parent]!.push(key);
    }
  },
);

export function useNutritionGoals(
  metrics: DRIMetrics,
  initialGoals: Record<string, Goal> = {},
) {
  const [goals, setGoals] = useState<Record<string, Goal>>(initialGoals);
  const utils = api.useUtils();

  const updateGoalsMutation = api.food.updateGoals.useMutation({
    onSuccess: () => {
      toast.success("Goals updated");
      void utils.food.getDailyNutrition.invalidate();
      // Removing window.location.reload() for better UX
    },
    onError: (err) => {
      toast.error("Failed to update goals: " + err.message);
    },
  });

  const validateGoal = (
    key: string,
    newGoal: Goal,
    currentGoals: Record<string, Goal>,
  ): string | null => {
    const { min, max, target } = newGoal;

    if (
      min !== undefined &&
      max !== undefined &&
      min > max &&
      (min > 0 || max > 0)
    ) {
      return "Minimum cannot be greater than Maximum.";
    }
    if (
      target !== undefined &&
      min !== undefined &&
      target < min &&
      target > 0
    ) {
      return "Target cannot be less than Minimum.";
    }
    if (target !== undefined && max !== undefined && target > max && max > 0) {
      return "Target cannot be greater than Maximum.";
    }

    const parentKey = PARENT_MAP[key];
    if (parentKey) {
      const parentGoal = currentGoals[parentKey];
      const parentTarget = parentGoal?.target;
      if (
        parentTarget !== undefined &&
        target !== undefined &&
        target > parentTarget
      ) {
        return `Cannot exceed ${parentKey} target (${parentTarget}g).`;
      }
    }

    const children = HIERARCHY[key];
    if (children) {
      for (const child of children) {
        const childGoal = currentGoals[child];
        const childTarget = childGoal?.target;
        if (
          childTarget !== undefined &&
          target !== undefined &&
          target < childTarget
        ) {
          return `Cannot be less than ${child} target (${childTarget}g).`;
        }
      }
    }

    return null;
  };

  const updateGoal = (key: string, newGoal: Goal) => {
    const error = validateGoal(key, newGoal, goals);
    if (error) {
      toast.error(error);
      return false;
    }

    const nextGoals: Record<string, Goal> = { ...goals, [key]: newGoal };

    // Recursive Parent Dependency Logic
    let currentKey: string = key;
    while (PARENT_MAP[currentKey]) {
      const parentKey = PARENT_MAP[currentKey]!;
      const childGoal = nextGoals[currentKey]!;
      const childTarget = childGoal.target;

      if (childTarget === undefined) break;

      const parentGoal = nextGoals[parentKey] || {};
      let currentParentTarget = parentGoal.target;
      if (currentParentTarget === undefined) {
        currentParentTarget =
          getClinicalValue(metrics, parentKey as CanonicalNutrientKey) ??
          undefined;
      }

      if (
        currentParentTarget !== undefined &&
        childTarget > currentParentTarget
      ) {
        nextGoals[parentKey] = { ...parentGoal, target: childTarget };
        toast.info(`Updated ${parentKey} target to match ${currentKey}`, {
          description: `Goal increased to ${childTarget}g`,
        });
        currentKey = parentKey;
      } else {
        break;
      }
    }

    setGoals(nextGoals);
    updateGoalsMutation.mutate({ goals: nextGoals });
    return true;
  };

  const applyMacroRatios = (ratios: {
    energy: number;
    carbs: number;
    protein: number;
    fat: number;
  }) => {
    const nextGoals: Record<string, Goal> = {
      ...goals,
      energy: { target: ratios.energy },
      carbohydrate: { target: ratios.carbs },
      protein: { target: ratios.protein },
      fat: { target: ratios.fat },
    };
    setGoals(nextGoals);
    updateGoalsMutation.mutate({ goals: nextGoals });
  };

  return {
    goals,
    updateGoal,
    applyMacroRatios,
    isUpdating: updateGoalsMutation.isPending,
  };
}
