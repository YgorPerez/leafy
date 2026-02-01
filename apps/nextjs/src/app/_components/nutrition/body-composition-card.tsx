"use client";

import { Edit2 } from "lucide-react";
import type { Goal } from "~/app/_hooks/use-nutrition-goals";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { DRIMetrics } from "~/lib/clinical-calculator";

interface BodyCompositionCardProps {
  metrics: DRIMetrics;
  weightGoal?: Goal;
  onEdit: () => void;
}

export function BodyCompositionCard({
  metrics,
  weightGoal,
  onEdit,
}: BodyCompositionCardProps) {
  return (
    <Card className="group relative overflow-hidden border border-white/5 bg-white/[0.02] shadow-sm backdrop-blur-md">
      <div className="absolute inset-0 bg-primary/5 transition-all duration-300 group-hover:bg-primary/10" />
      <CardContent className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <div className="absolute top-3 right-3">
          <Button
            className="h-8 w-8 text-muted-foreground opacity-0 transition-all hover:bg-white/10 group-hover:opacity-100"
            onClick={onEdit}
            size="icon"
            variant="ghost"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        <span className="mb-2 font-bold text-muted-foreground/60 text-xs uppercase tracking-[0.2em]">
          Body Composition
        </span>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-4xl tracking-tighter">
              {metrics.bmi}
            </span>
            <span className="font-semibold text-muted-foreground/60 text-sm uppercase">
              BMI
            </span>
          </div>
          {weightGoal?.target && (
            <div className="mt-2 flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/20 px-3 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="font-bold text-[10px] text-primary uppercase">
                Goal: {weightGoal.target}kg
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
