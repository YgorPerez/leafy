"use client";

import { Edit2 } from "lucide-react";

import type { NutrientValueRef } from "@acme/api/client";
import { normalizeToCanonicalKey } from "@acme/api/client";

import { type Goal } from "~/app/_hooks/use-nutrition-goals";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface NutrientRowProps {
  itemKey: string;
  label: string;
  value: { recommended: number | null; unit: string };
  goals: Record<string, Goal>;
  intake?: Record<string, number>;
  indent?: boolean;
  onEdit: (key: string, currentGoal: Goal, refVal: NutrientValueRef) => void;
}

export function NutrientRow({
  itemKey,
  label,
  value,
  goals,
  intake,
  indent,
  onEdit,
}: NutrientRowProps) {
  const currentGoal = goals[itemKey] || {};
  const isCustomized =
    goals[itemKey] !== undefined &&
    (currentGoal.target !== undefined ||
      currentGoal.min !== undefined ||
      currentGoal.max !== undefined);

  const displayTarget = isCustomized
    ? (currentGoal.target ?? value.recommended)
    : value.recommended;
  const displayMin = isCustomized ? currentGoal.min : undefined; // Registry doesn't have min/max yet in its simplified form
  const displayMax = isCustomized ? currentGoal.max : undefined;

  let intakeVal = 0;
  if (intake) {
    Object.entries(intake).forEach(([key, val]) => {
      const canonical = normalizeToCanonicalKey(key);
      if (canonical === itemKey) {
        intakeVal += (val as number) || 0;
      }
    });
  }

  const denominator =
    displayTarget && displayTarget > 0 ? displayTarget : displayMax || 100;
  const progress = (intakeVal / denominator) * 100;

  return (
    <div
      className={cn(
        "group/row relative -mx-2 flex flex-col gap-1 rounded-lg border-b border-white/5 px-2 py-2.5 transition-all last:border-0 hover:bg-white/[0.02]",
        indent && "ml-2 border-l border-white/10 pl-4",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm tracking-tight",
              isCustomized ? "text-primary font-semibold" : "text-foreground",
            )}
          >
            {label}
          </span>
          {isCustomized && (
            <div className="bg-primary h-1 w-1 rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
          )}
          <Button
            className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-6 w-6 opacity-0 transition-all group-hover/row:opacity-100"
            onClick={() =>
              onEdit(itemKey, currentGoal, value as NutrientValueRef)
            }
            size="icon"
            variant="ghost"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-right">
          <span className="text-muted-foreground/60 mr-1.5 font-mono text-xs">
            {intakeVal.toFixed(intakeVal < 1 ? 2 : 1)} /
          </span>
          <span
            className={cn(
              "font-mono text-sm",
              isCustomized ? "text-primary font-bold" : "font-medium",
            )}
          >
            {displayMin && displayMax && !displayTarget
              ? `${displayMin} - ${displayMax}`
              : (displayTarget ?? "-")}
          </span>
          <span className="text-muted-foreground ml-1 text-[10px] font-medium tracking-wider uppercase">
            {value.unit}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5 shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              progress >= 100
                ? "bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-primary/80 shadow-[0_0_10px_rgba(var(--primary),0.3)]",
              displayMax &&
                intakeVal > displayMax &&
                "bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span
          className={cn(
            "w-9 text-right font-mono text-[10px] font-medium",
            progress >= 100 ? "text-emerald-500" : "text-muted-foreground",
          )}
        >
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export function NutrientRowSkeleton() {
  return (
    <div className="-mx-2 flex flex-col gap-1 border-b border-white/5 px-2 py-3 last:border-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 bg-white/5" />
        <Skeleton className="h-4 w-20 bg-white/5" />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Skeleton className="h-1.5 flex-1 rounded-full bg-white/5" />
        <Skeleton className="h-3 w-8 bg-white/5" />
      </div>
    </div>
  );
}
