"use client";

import { useMemo } from "react";

import type { DRIMetrics } from "@acme/api/client";
import { getClinicalValue, normalizeToCanonicalKey } from "@acme/api/client";

import { type Goal } from "./use-nutrition-goals";

/**
 * Hook to resolve nutrient targets from custom goals and clinical DRI metrics.
 */
export function useResolvedTargets(
  metrics: DRIMetrics | null | undefined,
  customGoals: Record<string, Goal> | null | undefined,
) {
  const resolveTarget = useMemo(() => {
    return (nutrientName: string): number | null => {
      if (!metrics) return null;

      const canonicalKey = normalizeToCanonicalKey(nutrientName);
      if (!canonicalKey) return null;

      // Check custom goals first
      const customGoal = customGoals?.[canonicalKey]?.target;
      if (customGoal !== undefined) return customGoal;

      // Fallback to clinical DRI
      return getClinicalValue(metrics, canonicalKey);
    };
  }, [metrics, customGoals]);

  const resolveGoal = useMemo(() => {
    return (nutrientName: string): Goal | null => {
      if (!metrics) return null;

      const canonicalKey = normalizeToCanonicalKey(nutrientName);
      if (!canonicalKey) return null;

      const customGoal = customGoals?.[canonicalKey];
      const clinicalValue = getClinicalValue(metrics, canonicalKey);

      return {
        target: customGoal?.target ?? clinicalValue ?? undefined,
        min: customGoal?.min,
        max: customGoal?.max,
      };
    };
  }, [metrics, customGoals]);

  return { resolveTarget, resolveGoal };
}
