"use client";

import { Edit2 } from "lucide-react";

import type { DRIMetrics } from "@acme/api/client";

import type { Goal } from "~/app/_hooks/use-nutrition-goals";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

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
      <div className="bg-primary/5 group-hover:bg-primary/10 absolute inset-0 transition-all duration-300" />
      <CardContent className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <div className="absolute top-3 right-3">
          <Button
            className="text-muted-foreground h-8 w-8 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10"
            onClick={onEdit}
            size="icon"
            variant="ghost"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-muted-foreground/60 mb-2 text-xs font-bold tracking-[0.2em] uppercase">
          Body Composition
        </span>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tighter">
              {metrics.bmi}
            </span>
            <span className="text-muted-foreground/60 text-sm font-semibold uppercase">
              BMI
            </span>
          </div>
          {weightGoal?.target && (
            <div className="border-primary/20 bg-primary/20 mt-2 flex items-center gap-1.5 rounded-full border px-3 py-1">
              <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
              <span className="text-primary text-[10px] font-bold uppercase">
                Goal: {weightGoal.target}kg
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
