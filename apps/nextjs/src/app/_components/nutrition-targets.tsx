"use client";

import { useState } from "react";
import { format } from "date-fns";

import type {
  CanonicalNutrientKey,
  DRIMetrics,
  NutrientCategory,
  NutrientMetadata,
  NutrientValueRef,
} from "@acme/api/client";
import { getIntake, NUTRIENT_REGISTRY } from "@acme/api/client";

import type { Goal } from "~/app/_hooks/use-nutrition-goals";
import { useNutritionGoals } from "~/app/_hooks/use-nutrition-goals";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { BodyCompositionCard } from "./nutrition/body-composition-card";
import { EnergyCard } from "./nutrition/energy-card";
import { MacroEditor } from "./nutrition/macro-editor";
import { NutrientHierarchy } from "./nutrition/nutrient-hierarchy";
import { NutrientRowSkeleton } from "./nutrition/nutrient-row";

export function NutritionTargets({
  metrics,
  customGoals,
  date,
}: {
  metrics: DRIMetrics;
  customGoals?: Record<string, Goal>;
  date: Date;
}) {
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data: intake, isLoading } = api.food.getDailyNutrition.useQuery({
    date: formattedDate,
  });

  const { goals, updateGoal, applyMacroRatios } = useNutritionGoals(
    metrics,
    customGoals,
  );

  // Shared Edit State for individual goals
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editState, setEditState] = useState<{
    target: string;
    min: string;
    max: string;
  }>({ target: "", min: "", max: "" });
  const [systemRef, setSystemRef] = useState<NutrientValueRef | null>(null);
  const [macroEditorOpen, setMacroEditorOpen] = useState(false);

  const openEdit = (
    key: string,
    currentVal: Goal,
    refVal?: NutrientValueRef,
  ) => {
    setEditingKey(key);
    setEditState({
      target: currentVal.target?.toString() ?? "",
      min: currentVal.min?.toString() ?? "",
      max: currentVal.max?.toString() ?? "",
    });
    setSystemRef(refVal ?? null);
  };

  const handleSave = () => {
    if (!editingKey) return;
    const parse = (s: string) => (s === "" ? undefined : Number(s));
    const success = updateGoal(editingKey, {
      target: parse(editState.target),
      min: parse(editState.min),
      max: parse(editState.max),
    });
    if (success) setEditingKey(null);
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5 w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-primary flex items-center justify-between text-2xl">
            <span>Nutritional Progress</span>
            <span className="text-muted-foreground text-sm font-normal">
              Today
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <NutrientRowSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl overflow-hidden border-white/5 bg-[#0a0a0a] shadow-2xl">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6">
        <CardTitle className="flex items-center justify-between bg-gradient-to-br from-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          <span>Nutritional Progress</span>
          <span className="text-muted-foreground rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium backdrop-blur-sm">
            {format(date, "MMMM d, yyyy")}
          </span>
        </CardTitle>
        <CardDescription className="text-muted-foreground/80 mt-1">
          Daily tracking of nutrients vs. customized clinical targets.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-10 p-8">
        {/* Key Metrics Dashboard */}
        <div className="grid gap-6 md:grid-cols-3">
          <BodyCompositionCard
            metrics={metrics}
            weightGoal={goals["weight"]}
            onEdit={() =>
              openEdit("weight", goals["weight"] || {}, {
                recommended: 0,
                unit: "kg",
              })
            }
          />
          <EnergyCard
            intake={getIntake(intake, "energy")}
            target={goals["energy"]?.target ?? metrics.tee}
            onEdit={() =>
              openEdit("energy", goals["energy"] || {}, {
                recommended: metrics.tee,
                unit: "kcal",
              })
            }
          />
        </div>

        {/* Nutrient Sections */}
        {(["macro", "vitamin", "mineral"] as NutrientCategory[]).map(
          (category) => {
            const sectionNutrients = (
              Object.entries(NUTRIENT_REGISTRY) as [
                CanonicalNutrientKey,
                NutrientMetadata,
              ][]
            ).filter(([_, meta]) => meta.category === category && !meta.parent);

            if (sectionNutrients.length === 0) return null;

            return (
              <div className="space-y-6" key={category}>
                <div className="border-primary flex items-center justify-between rounded-md border-l-4 bg-white/[0.03] py-1.5 pr-2 pl-4">
                  <h3 className="text-lg font-bold tracking-tight text-white/90 capitalize">
                    {category === "macro" ? "Macronutrients" : `${category}s`}
                  </h3>
                  {category === "macro" && (
                    <Button
                      className="text-primary hover:bg-primary/10 h-7 text-[10px] font-bold tracking-wider uppercase"
                      onClick={() => setMacroEditorOpen(true)}
                      size="sm"
                      variant="ghost"
                    >
                      Adjust Ratios
                    </Button>
                  )}
                </div>

                <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
                  {sectionNutrients.map(([key]) => (
                    <NutrientHierarchy
                      key={key}
                      goals={goals}
                      intake={intake ?? undefined}
                      itemKey={key}
                      metrics={metrics}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              </div>
            );
          },
        )}
      </CardContent>

      <MacroEditor
        goals={goals}
        isOpen={macroEditorOpen}
        metrics={metrics}
        onApply={applyMacroRatios}
        onClose={() => setMacroEditorOpen(false)}
      />

      <Dialog
        onOpenChange={(open) => !open && setEditingKey(null)}
        open={!!editingKey}
      >
        <DialogContent className="border-white/10 bg-[#0c0c0c] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Set Custom Goal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs tracking-widest uppercase">
                {editingKey &&
                  NUTRIENT_REGISTRY[editingKey as CanonicalNutrientKey]
                    ?.label}{" "}
                Target
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  className="h-12 border-white/10 bg-white/5 font-mono text-xl"
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, target: e.target.value }))
                  }
                  placeholder={systemRef?.recommended?.toString()}
                  type="number"
                  value={editState.target}
                />
                <span className="text-muted-foreground font-bold">
                  {systemRef?.unit}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase">
                  Minimum
                </Label>
                <Input
                  className="border-white/10 bg-white/5"
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, min: e.target.value }))
                  }
                  type="number"
                  value={editState.min}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase">
                  Maximum
                </Label>
                <Input
                  className="border-white/10 bg-white/5"
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, max: e.target.value }))
                  }
                  type="number"
                  value={editState.max}
                />
              </div>
            </div>
            <Button
              className="group bg-primary text-primary-foreground relative w-full overflow-hidden py-6 text-lg font-bold transition-all hover:scale-[1.02]"
              onClick={handleSave}
            >
              <div className="relative z-10">Save Goal</div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
