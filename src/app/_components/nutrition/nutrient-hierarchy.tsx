"use client";

import { HIERARCHY, type Goal } from "~/app/_hooks/use-nutrition-goals";
import type { DRIMetrics } from "~/lib/clinical-calculator";
import {
  getClinicalValue,
  NUTRIENT_REGISTRY,
  type CanonicalNutrientKey,
} from "~/lib/nutrients/registry";
import { NutrientRow } from "./nutrient-row";

interface NutrientHierarchyProps {
  itemKey: string;
  metrics: DRIMetrics;
  goals: Record<string, Goal>;
  intake?: Record<string, number>;
  onEdit: (
    key: string,
    currentVal: Goal,
    refVal?: { recommended: number; unit: string },
  ) => void;
  depth?: number;
}

export function NutrientHierarchy({
  itemKey,
  metrics,
  goals,
  intake,
  onEdit,
  depth = 0,
}: NutrientHierarchyProps) {
  const meta = NUTRIENT_REGISTRY[itemKey as CanonicalNutrientKey];
  if (!meta) return null;

  const children = HIERARCHY[itemKey];

  return (
    <div
      className={
        depth > 0
          ? depth === 1
            ? "my-2 space-y-1 border-white/10 border-l pl-4"
            : "ml-4 border-white/5 border-l pl-4"
          : "space-y-1"
      }
    >
      <NutrientRow
        goals={goals}
        indent={depth > 0}
        intake={intake}
        itemKey={itemKey}
        label={meta.label}
        onEdit={onEdit}
        value={{
          recommended: getClinicalValue(
            metrics,
            itemKey as CanonicalNutrientKey,
          ),
          unit: meta.unit,
        }}
      />
      {children?.map((childKey) => (
        <NutrientHierarchy
          key={childKey}
          goals={goals}
          intake={intake}
          itemKey={childKey}
          metrics={metrics}
          onEdit={onEdit}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
