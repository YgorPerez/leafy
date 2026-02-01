"use client";

import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface Nutrient {
  name: string;
  value: number;
  unit: string | null;
}

interface NutrientProgressProps {
  nutrients: Nutrient[];
  servingSize: number;
  resolveTarget: (name: string) => number | null;
  isLoading?: boolean;
}

export function NutrientProgress({
  nutrients,
  servingSize,
  resolveTarget,
  isLoading,
}: NutrientProgressProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="space-y-2" key={i}>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-7 md:grid-cols-2">
      {nutrients.map((n, i) => {
        const isMacro = ["protein", "carbohydrate", "fat"].some((m) =>
          n.name.toLowerCase().includes(m),
        );

        const dailyTarget = resolveTarget(n.name);

        let progressValue = 0;
        if (dailyTarget && dailyTarget > 0) {
          progressValue = (n.value / dailyTarget) * 100;
        } else {
          // Fallback logic
          const maxVal = isMacro ? servingSize / 2 : 100;
          progressValue = (n.value / maxVal) * 100;
        }

        return (
          <div className="group space-y-2.5" key={i}>
            <div className="flex items-end justify-between text-sm">
              <span className="font-bold text-foreground capitalize transition-colors group-hover:text-primary">
                {n.name}
              </span>
              <div className="flex flex-col items-end">
                <span className="rounded-md border border-primary/10 bg-primary/5 px-3 py-1 font-black font-mono text-foreground text-xs">
                  {n.value.toFixed(1)}{" "}
                  <span className="ml-0.5 text-[10px] text-foreground/70">
                    {n.unit}
                  </span>
                </span>
                {dailyTarget && (
                  <span className="mt-0.5 font-medium text-[10px] text-muted-foreground">
                    {Math.round((n.value / dailyTarget) * 100)}% of daily goal
                  </span>
                )}
              </div>
            </div>
            <Progress
              className={cn(
                "h-2.5 bg-primary/10 ring-1 ring-primary/5",
                n.name.toLowerCase().includes("protein") &&
                  "[&>div]:bg-red-500",
                n.name.toLowerCase().includes("carbohydrate") &&
                  "[&>div]:bg-yellow-500",
                n.name.toLowerCase().includes("fat") && "[&>div]:bg-green-500",
              )}
              value={Math.min(progressValue, 100)}
            />
          </div>
        );
      })}
    </div>
  );
}
