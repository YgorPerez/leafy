"use client";

import { format } from "date-fns";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { type DRIMetrics } from "~/lib/clinical-calculator";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

type Goal = {
  target?: number;
  min?: number;
  max?: number;
};

const HIERARCHY: Record<string, string[]> = {
  carbohydrate: ["starch", "fiber", "sugar"],
  fiber: ["soluble", "insoluble"],
  sugar: [
    "added",
    "alcohol",
    "fructose",
    "sucrose",
    "glucose",
    "lactose",
    "maltose",
    "galactose",
  ],
  fat: [
    "saturated",
    "trans",
    "monounsaturated",
    "polyunsaturated",
    "omega3",
    "omega6",
    "cholesterol",
  ],
  protein: [
    "alanine",
    "arginine",
    "asparticAcid",
    "cystine",
    "glutamicAcid",
    "glutamine",
    "glycine",
    "histidine",
    "hydroxyproline",
    "isoleucine",
    "leucine",
    "lysine",
    "methionine",
    "phenylalanine",
    "proline",
    "serine",
    "threonine",
    "tryptophan",
    "tyrosine",
    "valine",
  ],
};

// Reverse lookup for parent checking
const PARENT_MAP: Record<string, string> = {};
Object.entries(HIERARCHY).forEach(([parent, children]) => {
  children.forEach((child) => {
    PARENT_MAP[child] = parent;
  });
});

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

  const [goals, setGoals] = useState<Record<string, Goal>>(customGoals || {});

  const updateGoalsMutation = api.food.updateGoals.useMutation({
    onSuccess: () => {
      toast.success("Goals updated");
      // Consider reacting to state change rather than reload, but consistent with existing pattern
      window.location.reload();
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
    // 1. Logic Check: Min <= Target <= Max
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

    // 2. Physics Check: Child <= Parent
    const parentKey = PARENT_MAP[key];
    if (parentKey) {
      const parentGoal = currentGoals[parentKey];
      // Resolve parent value: Custom Target > Custom Min > System Recommended
      // We mainly care about not exceeding the parent's generic capacity
      // If parent has a target, we strictly shouldn't exceed it.
      // Accessing deep nested system metrics is hard here without a lookup helper,
      // so we'll rely on what's available in `currentGoals` or fallback safely.
      // For now, let's enforce against set Custom Goals, as system defaults are loose.

      const parentTarget = parentGoal?.target; // || parentGoal?.max?
      if (
        parentTarget !== undefined &&
        target !== undefined &&
        target > parentTarget
      ) {
        return `Cannot exceed ${parentKey} target (${parentTarget}g).`;
      }
    }

    // 3. Physics Check: Parent >= Child (for all children)
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

  // Shared Edit State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editState, setEditState] = useState<{
    target: string;
    min: string;
    max: string;
  }>({ target: "", min: "", max: "" });

  const handleSave = () => {
    if (!editingKey) return;

    const parse = (s: string) => (s === "" ? undefined : Number(s));
    const newGoal: Goal = {
      target: parse(editState.target),
      min: parse(editState.min),
      max: parse(editState.max),
    };

    const error = validateGoal(editingKey, newGoal, goals);
    if (error) {
      toast.error(error);
      return;
    }

    let nextGoals: Record<string, Goal> = { ...goals, [editingKey]: newGoal };

    // Recursive Parent Dependency Logic: If child target > parent target, bump parent.
    let currentKey: string = editingKey;
    while (PARENT_MAP[currentKey]) {
      const parentKey = PARENT_MAP[currentKey]!;
      const childGoal = nextGoals[currentKey]!;
      const childTarget = childGoal.target;

      if (childTarget === undefined) break;

      const parentGoal = nextGoals[parentKey] || {};

      // Resolve current parent target (custom or system)
      let currentParentTarget = parentGoal.target;
      if (currentParentTarget === undefined) {
        // Flattened lookup for system defaults
        if (parentKey === "carbohydrate")
          currentParentTarget =
            metrics.nutrients.carbohydrate.total.recommended;
        else if (parentKey === "protein")
          currentParentTarget = metrics.nutrients.protein.total.recommended;
        else if (parentKey === "fat")
          currentParentTarget = metrics.nutrients.fat.total.recommended;
        else if (parentKey === "fiber")
          currentParentTarget =
            metrics.nutrients.carbohydrate.fiber.total.recommended;
        else if (parentKey === "sugar")
          currentParentTarget =
            metrics.nutrients.carbohydrate.sugar.total.recommended;
      }

      if (
        currentParentTarget !== undefined &&
        childTarget > currentParentTarget
      ) {
        nextGoals[parentKey] = { ...parentGoal, target: childTarget };
        toast.info(`Updated ${parentKey} target to match ${currentKey}`, {
          description: `Goal increased to ${childTarget}g`,
        });
        currentKey = parentKey; // Continue up the chain
      } else {
        break; // No further updates needed
      }
    }

    setGoals(nextGoals);
    updateGoalsMutation.mutate({ goals: nextGoals });
    setEditingKey(null);
  };

  // --- NEW: Unified Macro Editor State ---
  const [macroEditorOpen, setMacroEditorOpen] = useState(false);
  const [macroEditState, setMacroEditState] = useState({
    energy: 2000,
    carbs: { g: 0, pct: 50 },
    protein: { g: 0, pct: 20 },
    fat: { g: 0, pct: 30 },
  });

  const syncMacros = (
    base: "g" | "pct" | "energy",
    values: typeof macroEditState,
  ) => {
    const { energy, carbs, protein, fat } = values;
    let next = { ...values };

    if (base === "energy" || base === "pct") {
      // If a percentage changed, we might want to balance the others
      if (base === "pct") {
        const total = next.carbs.pct + next.protein.pct + next.fat.pct;
        if (total !== 100) {
          // Adjust the other two macros proportionally to reach 100
          // For simplicity, we'll find the "other" two keys
          const keys = ["carbs", "protein", "fat"] as const;
          const changedKey = (Object.keys(values).find(
            (k) => (values as any)[k].pct !== (macroEditState as any)[k].pct,
          ) || "carbs") as (typeof keys)[number];

          const others = keys.filter((k) => k !== changedKey);
          const currentOthersTotal =
            (macroEditState as any)[others[0]!].pct +
            (macroEditState as any)[others[1]!].pct;
          const newOthersTotal = 100 - (next as any)[changedKey].pct;

          if (currentOthersTotal > 0) {
            (next as any)[others[0]!].pct = Math.round(
              ((macroEditState as any)[others[0]!].pct / currentOthersTotal) *
                newOthersTotal,
            );
          } else {
            (next as any)[others[0]!].pct = Math.floor(newOthersTotal / 2);
          }
          (next as any)[others[1]!].pct =
            100 - (next as any)[changedKey].pct - (next as any)[others[0]!].pct;
        }
      }

      // Grams = Energy * Pct / (kcal/g)
      next.carbs.g = Math.round((energy * (next.carbs.pct / 100)) / 4);
      next.protein.g = Math.round((energy * (next.protein.pct / 100)) / 4);
      next.fat.g = Math.round((energy * (next.fat.pct / 100)) / 9);
    } else if (base === "g") {
      // Pct = Grams * (kcal/g) / Energy
      next.carbs.pct = Math.round(((carbs.g * 4) / energy) * 100);
      next.protein.pct = Math.round(((protein.g * 4) / energy) * 100);
      next.fat.pct = Math.round(((fat.g * 9) / energy) * 100);
    }

    return next;
  };

  const handleApplyMacros = () => {
    const nextGoals: Record<string, Goal> = {
      ...goals,
      energy: { target: macroEditState.energy },
      carbohydrate: { target: macroEditState.carbs.g },
      protein: { target: macroEditState.protein.g },
      fat: { target: macroEditState.fat.g },
    };
    setGoals(nextGoals);
    updateGoalsMutation.mutate({ goals: nextGoals });
    setMacroEditorOpen(false);
  };

  const calculateSuggestedEnergy = () => {
    const targetWeight = goals["weight"]?.target;
    if (!targetWeight) return metrics.tee;

    const diff = targetWeight - metrics.weight; // We need weight in metrics or props
    // Simple logic: 500kcal surplus/deficit for 0.5kg/week change
    if (Math.abs(diff) < 0.1) return metrics.tee;
    return diff > 0 ? metrics.tee + 500 : metrics.tee - 500;
  };

  // --- End Macro Editor Logic ---

  const [systemRef, setSystemRef] = useState<any>(null);

  const openEdit = (key: string, currentVal: Goal, refVal?: any) => {
    setEditingKey(key);
    setEditState({
      target: currentVal.target?.toString() ?? "",
      min: currentVal.min?.toString() ?? "",
      max: currentVal.max?.toString() ?? "",
    });
    setSystemRef(refVal);
  };

  // Helper to get system defaults for the editing dialog
  const getSystemDefault = (key: string) => {
    if (key === "energy") return { recommended: metrics.tee, unit: "kcal" };
    if (key === "weight") return { recommended: 0, unit: "kg" }; // No recommendation logic yet

    // Naively search in metrics structure (optimized path would be flatten metrics first)
    // For now, let's just match known structure path or return generic
    // Use the `value` prop passed to NutrientRow if available?
    // Since we lift state, we need to know the 'value' for the currently edited key to show in dialog.
    // We can pass it into `openEdit` or look it up.
    return { recommended: 0, unit: "g" };
  };

  const NutrientRow = ({
    itemKey,
    label,
    value,
    isRange,
    indent,
  }: {
    itemKey: string;
    label: string;
    value: any;
    isRange?: boolean;
    indent?: boolean;
  }) => {
    // Initialize current goal state from parent
    const currentGoal = goals[itemKey] || {};

    const isCustomized =
      goals[itemKey] !== undefined &&
      (currentGoal.target !== undefined ||
        currentGoal.min !== undefined ||
        currentGoal.max !== undefined);

    // Determine values to display
    const displayTarget = isCustomized
      ? (currentGoal.target ?? value.recommended)
      : value.recommended;
    const displayMin = isCustomized ? currentGoal.min : value.min;
    const displayMax = isCustomized ? currentGoal.max : value.max;

    // Intake mapping
    let intakeVal = 0;
    if (intake) {
      if (itemKey === "protein")
        intakeVal = intake.protein || intake.proteins || 0;
      else if (itemKey === "carbohydrate")
        intakeVal = intake.carbohydrate || intake.carbohydrates || 0;
      else if (itemKey === "fat") intakeVal = intake.fat || 0;
      else if (itemKey === "fiber") intakeVal = intake.fiber || 0;
      else if (itemKey === "soluble")
        intakeVal = (intake as any)["Fiber, soluble"] || 0;
      else if (itemKey === "insoluble")
        intakeVal = (intake as any)["Fiber, insoluble"] || 0;
      else if (itemKey === "sugar")
        intakeVal =
          (intake as any)["Sugars, total including NLEA"] ||
          (intake as any)["Total Sugars"] ||
          0;
      else if (itemKey === "added")
        intakeVal = (intake as any)["Sugars, added"] || 0;
      else if (itemKey === "alcohol")
        intakeVal = (intake as any)["Sugar alcohols"] || 0;
      else intakeVal = (intake as any)[itemKey] || 0;
    }

    // Progress Calculation
    // If we have a max, use that as the "100%" visual reference if target isn't hit?
    // Standard: Progress -> Target.
    // Range: If < Min (Low), Min-Max (Good), > Max (High).
    // For simple bar:
    const denominator = displayTarget > 0 ? displayTarget : displayMax || 100;
    const progress = (intakeVal / denominator) * 100;

    const onOpenChange = (open: boolean) => {
      // setIsOpen(open); // No longer local state
      if (open) {
        openEdit(itemKey, currentGoal, value);
      }
    };

    // We use the shared dialog now, but we need to trigger it.
    // We can keep the button and just have it call `openEdit`.

    return (
      <div
        className={cn(
          "flex flex-col gap-1 border-white/5 border-b py-2.5 last:border-0 relative group/row transition-all hover:bg-white/[0.02] rounded-lg px-2 -mx-2",
          indent && "pl-4 border-l border-white/10 ml-2",
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
              <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-all hover:text-primary hover:bg-primary/10"
              onClick={() => openEdit(itemKey, currentGoal, value)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground/60 mr-1.5 font-mono">
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
            <span className="ml-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {value.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden relative shadow-inner">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out rounded-full",
                progress >= 100
                  ? "bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-primary/80 shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                intakeVal > (displayMax || 99999) &&
                  "bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span
            className={cn(
              "text-[10px] font-mono w-9 text-right font-medium",
              progress >= 100 ? "text-emerald-500" : "text-muted-foreground",
            )}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  };

  const energyIntake = intake?.energy_kcal || 0;
  const energyTarget = goals["energy"]?.target ?? metrics.tee;
  const energyProgress = (energyIntake / energyTarget) * 100;

  // Skeleton loading UI for nutrient rows
  const NutrientRowSkeleton = () => (
    <div className="flex flex-col gap-1 border-white/5 border-b py-3 last:border-0 px-2 -mx-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 bg-white/5" />
        <Skeleton className="h-4 w-20 bg-white/5" />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Skeleton className="h-1.5 flex-1 rounded-full bg-white/5" />
        <Skeleton className="h-3 w-8 bg-white/5" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex justify-between items-center">
            <span>Nutritional Progress</span>
            <span className="text-sm font-normal text-muted-foreground">
              Today
            </span>
          </CardTitle>
          <CardDescription>
            Daily tracking of nutrients vs. customized clinical targets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Key Metrics Skeleton */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-none bg-background/50 shadow-sm overflow-hidden relative">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <span className="text-sm font-medium uppercase text-muted-foreground">
                  BMI
                </span>
                <Skeleton className="h-9 w-16 mt-1" />
              </CardContent>
            </Card>
            <Card className="border-none bg-background/50 shadow-sm overflow-hidden relative md:col-span-2">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium uppercase text-muted-foreground">
                    Energy Intake
                  </span>
                  <Skeleton className="h-9 w-32 mt-1" />
                </div>
                <div className="flex flex-col items-end">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Macronutrients Skeleton */}
          <div className="space-y-4">
            <h3 className="border-b border-primary/20 pb-2 text-lg font-semibold text-primary">
              Macronutrients
            </h3>
            <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <NutrientRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl border-white/5 bg-[#0a0a0a] shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6">
        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent flex justify-between items-center">
          <span>Nutritional Progress</span>
          <span className="text-sm font-medium text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            {format(date, "MMMM d, yyyy")}
          </span>
        </CardTitle>
        <CardDescription className="text-muted-foreground/80 mt-1">
          Daily tracking of nutrients vs. customized clinical targets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 p-8">
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border border-white/5 bg-white/[0.02] shadow-sm overflow-hidden relative group backdrop-blur-md">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-all duration-300" />
            <CardContent className="flex flex-col items-center justify-center p-8 text-center relative z-10">
              <div className="absolute top-3 right-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                  onClick={() =>
                    openEdit("weight", goals["weight"] || {}, {
                      recommended: 0,
                      unit: "kg",
                    })
                  }
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                Body Composition
              </span>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter">
                    {metrics.bmi}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground/60 uppercase">
                    BMI
                  </span>
                </div>
                {/* Show weight target if exists */}
                {goals["weight"]?.target && (
                  <div className="mt-2 flex items-center gap-1.5 bg-primary/20 px-3 py-1 rounded-full border border-primary/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-primary uppercase">
                      Goal: {goals["weight"].target}kg
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Energy Card */}
          <Card className="border border-white/5 bg-white/[0.02] shadow-sm overflow-hidden relative group md:col-span-2 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute top-3 right-3 z-20">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                onClick={() =>
                  openEdit("energy", goals["energy"] || {}, {
                    recommended: metrics.tee,
                    unit: "kcal",
                  })
                }
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="flex items-center justify-between p-8 relative z-10">
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  Energy Expenditure
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-white">
                    {energyIntake.toFixed(0)}
                  </span>
                  <span className="text-xl font-medium text-muted-foreground/40">
                    / {goals["energy"]?.target ?? metrics.tee} kcal
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={175.92}
                      strokeDashoffset={
                        175.92 * (1 - Math.min(energyProgress / 100, 1))
                      }
                      className="text-primary transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold">
                    {Math.round(energyProgress)}%
                  </span>
                </div>
              </div>
            </CardContent>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/[0.02]">
              <div
                className="h-full bg-gradient-to-r from-primary/40 to-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-1000 ease-in-out"
                style={{ width: `${Math.min(energyProgress, 100)}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Macronutrients */}
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white/[0.03] pl-4 pr-2 py-1.5 rounded-md border-l-4 border-primary">
            <h3 className="text-lg font-bold tracking-tight text-white/90">
              Macronutrients
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] uppercase font-bold tracking-wider text-primary hover:bg-primary/10 h-7"
              onClick={() => {
                const currentEnergy = goals["energy"]?.target ?? metrics.tee;
                const c =
                  goals["carbohydrate"]?.target ??
                  metrics.nutrients.carbohydrate.total.recommended;
                const p =
                  goals["protein"]?.target ??
                  metrics.nutrients.protein.total.recommended;
                const f =
                  goals["fat"]?.target ??
                  metrics.nutrients.fat.total.recommended;

                const initialState = {
                  energy: currentEnergy,
                  carbs: {
                    g: c,
                    pct: Math.round(((c * 4) / currentEnergy) * 100),
                  },
                  protein: {
                    g: p,
                    pct: Math.round(((p * 4) / currentEnergy) * 100),
                  },
                  fat: {
                    g: f,
                    pct: Math.round(((f * 9) / currentEnergy) * 100),
                  },
                };
                setMacroEditState(initialState);
                setMacroEditorOpen(true);
              }}
            >
              Adjust Ratios
            </Button>
          </div>
          <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
            <NutrientRow
              itemKey="carbohydrate"
              label="Carbohydrate"
              value={metrics.nutrients.carbohydrate.total}
              isRange
            />
            <div className="pl-4 border-l border-white/10 space-y-1 my-2">
              <NutrientRow
                itemKey="fiber"
                label="Total Fiber"
                value={metrics.nutrients.carbohydrate.fiber.total}
                indent
              />
              <NutrientRow
                itemKey="soluble"
                label="Soluble Fiber"
                value={metrics.nutrients.carbohydrate.fiber.soluble}
                indent
              />
              <NutrientRow
                itemKey="insoluble"
                label="Insoluble Fiber"
                value={metrics.nutrients.carbohydrate.fiber.insoluble}
                indent
              />

              {/* Sugars Grouped Under Carbohydrate */}
              <div className="mt-2 pl-4 border-l border-white/5 space-y-1">
                <NutrientRow
                  itemKey="sugar"
                  label="Total Sugars"
                  value={metrics.nutrients.carbohydrate.sugar.total}
                  indent
                />
                <div className="mt-1 pl-4 border-l border-white/5 space-y-1">
                  <NutrientRow
                    itemKey="added"
                    label="Added Sugars"
                    value={metrics.nutrients.carbohydrate.sugar.added}
                    indent
                  />
                  <NutrientRow
                    itemKey="alcohol"
                    label="Sugar Alcohols"
                    value={metrics.nutrients.carbohydrate.sugar.alcohol}
                    indent
                  />
                  {/* Specific Sugars */}
                  <NutrientRow
                    itemKey="fructose"
                    label="Fructose"
                    value={metrics.nutrients.carbohydrate.sugar.fructose}
                    indent
                  />
                  <NutrientRow
                    itemKey="sucrose"
                    label="Sucrose"
                    value={metrics.nutrients.carbohydrate.sugar.sucrose}
                    indent
                  />
                  <NutrientRow
                    itemKey="glucose"
                    label="Glucose"
                    value={metrics.nutrients.carbohydrate.sugar.glucose}
                    indent
                  />
                  <NutrientRow
                    itemKey="lactose"
                    label="Lactose"
                    value={metrics.nutrients.carbohydrate.sugar.lactose}
                    indent
                  />
                  <NutrientRow
                    itemKey="maltose"
                    label="Maltose"
                    value={metrics.nutrients.carbohydrate.sugar.maltose}
                    indent
                  />
                  <NutrientRow
                    itemKey="galactose"
                    label="Galactose"
                    value={metrics.nutrients.carbohydrate.sugar.galactose}
                    indent
                  />
                </div>
              </div>
            </div>
            <NutrientRow
              itemKey="protein"
              label="Protein"
              value={metrics.nutrients.protein.total}
            />
            {/* Amino Acids */}
            <div className="pl-4 border-l border-white/10 space-y-1 my-2">
              <div className="text-[10px] uppercase text-muted-foreground font-medium mb-1 pl-1">
                Amino Acids
              </div>
              {/* Essential */}
              <NutrientRow
                itemKey="histidine"
                label="Histidine"
                value={metrics.nutrients.protein.histidine}
                indent
              />
              <NutrientRow
                itemKey="isoleucine"
                label="Isoleucine"
                value={metrics.nutrients.protein.isoleucine}
                indent
              />
              <NutrientRow
                itemKey="leucine"
                label="Leucine"
                value={metrics.nutrients.protein.leucine}
                indent
              />
              <NutrientRow
                itemKey="lysine"
                label="Lysine"
                value={metrics.nutrients.protein.lysine}
                indent
              />
              <NutrientRow
                itemKey="methionine"
                label="Methionine"
                value={metrics.nutrients.protein.methionine}
                indent
              />
              <NutrientRow
                itemKey="phenylalanine"
                label="Phenylalanine"
                value={metrics.nutrients.protein.phenylalanine}
                indent
              />
              <NutrientRow
                itemKey="threonine"
                label="Threonine"
                value={metrics.nutrients.protein.threonine}
                indent
              />
              <NutrientRow
                itemKey="tryptophan"
                label="Tryptophan"
                value={metrics.nutrients.protein.tryptophan}
                indent
              />
              <NutrientRow
                itemKey="valine"
                label="Valine"
                value={metrics.nutrients.protein.valine}
                indent
              />

              {/* Non-Essential / Conditional */}
              <NutrientRow
                itemKey="cystine"
                label="Cystine"
                value={metrics.nutrients.protein.cystine}
                indent
              />
              <NutrientRow
                itemKey="tyrosine"
                label="Tyrosine"
                value={metrics.nutrients.protein.tyrosine}
                indent
              />
              <NutrientRow
                itemKey="arginine"
                label="Arginine"
                value={metrics.nutrients.protein.arginine}
                indent
              />
              <NutrientRow
                itemKey="alanine"
                label="Alanine"
                value={metrics.nutrients.protein.alanine}
                indent
              />
              <NutrientRow
                itemKey="asparticAcid"
                label="Aspartic Acid"
                value={metrics.nutrients.protein.asparticAcid}
                indent
              />
              <NutrientRow
                itemKey="glutamicAcid"
                label="Glutamic Acid"
                value={metrics.nutrients.protein.glutamicAcid}
                indent
              />
              <NutrientRow
                itemKey="glycine"
                label="Glycine"
                value={metrics.nutrients.protein.glycine}
                indent
              />
              <NutrientRow
                itemKey="proline"
                label="Proline"
                value={metrics.nutrients.protein.proline}
                indent
              />
              <NutrientRow
                itemKey="serine"
                label="Serine"
                value={metrics.nutrients.protein.serine}
                indent
              />
            </div>

            <NutrientRow
              itemKey="fat"
              label="Fat"
              value={metrics.nutrients.fat.total}
              isRange
            />
            <div className="pl-4 border-l border-white/10 space-y-1 my-2">
              <NutrientRow
                itemKey="saturatedFat"
                label="Saturated Fat"
                value={metrics.nutrients.fat.saturated}
                indent
              />
              <NutrientRow
                itemKey="transFat"
                label="Trans Fat"
                value={metrics.nutrients.fat.trans}
                indent
              />
              <NutrientRow
                itemKey="monounsaturated"
                label="Monounsaturated"
                value={metrics.nutrients.fat.monounsaturated}
                indent
              />
              <NutrientRow
                itemKey="polyunsaturated"
                label="Polyunsaturated"
                value={metrics.nutrients.fat.polyunsaturated}
                indent
              />
              <NutrientRow
                itemKey="alphaLinolenicAcid"
                label="Omega-3 (ALA)"
                value={metrics.nutrients.fat.omega3}
                indent
              />
              <NutrientRow
                itemKey="linoleicAcid"
                label="Omega-6 (LA)"
                value={metrics.nutrients.fat.omega6}
                indent
              />
              <NutrientRow
                itemKey="cholesterol"
                label="Cholesterol"
                value={metrics.nutrients.fat.cholesterol}
                indent
              />
            </div>
            <NutrientRow
              itemKey="water"
              label="Total Water"
              value={metrics.nutrients.water}
            />
          </div>
        </div>

        {/* Vitamins */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-white/90 border-l-4 border-primary pl-4 py-1.5 bg-white/[0.03] rounded-r-md">
            Vitamins
          </h3>
          <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
            <NutrientRow
              itemKey="vitaminA"
              label="Vitamin A"
              value={metrics.nutrients.vitaminA}
            />
            <NutrientRow
              itemKey="vitaminC"
              label="Vitamin C"
              value={metrics.nutrients.vitaminC}
            />
            <NutrientRow
              itemKey="vitaminD"
              label="Vitamin D"
              value={metrics.nutrients.vitaminD}
            />
            <NutrientRow
              itemKey="vitaminE"
              label="Vitamin E"
              value={metrics.nutrients.vitaminE}
            />
            <NutrientRow
              itemKey="vitaminK"
              label="Vitamin K"
              value={metrics.nutrients.vitaminK}
            />
            <NutrientRow
              itemKey="thiamin"
              label="Thiamin (B1)"
              value={metrics.nutrients.thiamin}
            />
            <NutrientRow
              itemKey="riboflavin"
              label="Riboflavin (B2)"
              value={metrics.nutrients.riboflavin}
            />
            <NutrientRow
              itemKey="niacin"
              label="Niacin (B3)"
              value={metrics.nutrients.niacin}
            />
            <NutrientRow
              itemKey="vitaminB6"
              label="Vitamin B6"
              value={metrics.nutrients.vitaminB6}
            />
            <NutrientRow
              itemKey="folate"
              label="Folate (B9)"
              value={metrics.nutrients.folate}
            />
            <NutrientRow
              itemKey="vitaminB12"
              label="Vitamin B12"
              value={metrics.nutrients.vitaminB12}
            />
            <NutrientRow
              itemKey="choline"
              label="Choline"
              value={metrics.nutrients.choline}
            />
            <NutrientRow
              itemKey="pantothenicAcid"
              label="Pantothenic Acid"
              value={metrics.nutrients.pantothenicAcid}
            />
            <NutrientRow
              itemKey="biotin"
              label="Biotin"
              value={metrics.nutrients.biotin}
            />
          </div>
        </div>

        {/* Minerals */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-white/90 border-l-4 border-primary pl-4 py-1.5 bg-white/[0.03] rounded-r-md">
            Minerals
          </h3>
          <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
            <NutrientRow
              itemKey="calcium"
              label="Calcium"
              value={metrics.nutrients.calcium}
            />
            <NutrientRow
              itemKey="chloride"
              label="Chloride"
              value={metrics.nutrients.chloride}
            />
            <NutrientRow
              itemKey="copper"
              label="Copper"
              value={metrics.nutrients.copper}
            />
            <NutrientRow
              itemKey="fluoride"
              label="Fluoride"
              value={metrics.nutrients.fluoride}
            />
            <NutrientRow
              itemKey="iodine"
              label="Iodine"
              value={metrics.nutrients.iodine}
            />
            <NutrientRow
              itemKey="iron"
              label="Iron"
              value={metrics.nutrients.iron}
            />
            <NutrientRow
              itemKey="magnesium"
              label="Magnesium"
              value={metrics.nutrients.magnesium}
            />
            <NutrientRow
              itemKey="manganese"
              label="Manganese"
              value={metrics.nutrients.manganese}
            />
            <NutrientRow
              itemKey="phosphorus"
              label="Phosphorus"
              value={metrics.nutrients.phosphorus}
            />
            <NutrientRow
              itemKey="potassium"
              label="Potassium"
              value={metrics.nutrients.potassium}
            />
            <NutrientRow
              itemKey="selenium"
              label="Selenium"
              value={metrics.nutrients.selenium}
            />
            <NutrientRow
              itemKey="sodium"
              label="Sodium"
              value={metrics.nutrients.sodium}
            />
            <NutrientRow
              itemKey="zinc"
              label="Zinc"
              value={metrics.nutrients.zinc}
            />
          </div>
        </div>
      </CardContent>

      {/* Shared Goal Edit Dialog */}
      <Dialog
        open={!!editingKey}
        onOpenChange={(open) => {
          if (!open) {
            setEditingKey(null);
            setSystemRef(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Goal:{" "}
              {editingKey &&
                editingKey.charAt(0).toUpperCase() + editingKey.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            {/* System References */}
            {systemRef && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold uppercase tracking-wider text-[10px] mb-2">
                  Clinical Guidelines
                </div>
                <div className="flex justify-between">
                  <span>RDA (Recommended):</span>
                  <span className="font-mono">
                    {systemRef.recommended} {systemRef.unit}
                  </span>
                </div>
                {systemRef.ul && systemRef.ul !== "ND" && (
                  <div className="flex justify-between text-orange-500/80">
                    <span>Upper Limit (UL):</span>
                    <span className="font-mono">
                      {systemRef.ul} {systemRef.unit}
                    </span>
                  </div>
                )}
                {systemRef.note && ( // Show note if exists
                  <div className="pt-1 mt-1 border-t border-white/5 italic">
                    {systemRef.note}
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Min</Label>
                <Input
                  type="number"
                  value={editState.min}
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, min: e.target.value }))
                  }
                  placeholder={systemRef?.min?.toString() || "-"}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-primary">Target</Label>
                <Input
                  type="number"
                  value={editState.target}
                  onChange={(e) =>
                    setEditState((s) => ({
                      ...s,
                      target: e.target.value,
                    }))
                  }
                  placeholder={systemRef?.recommended?.toString()}
                  className="border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Max</Label>
                <Input
                  type="number"
                  value={editState.max}
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, max: e.target.value }))
                  }
                  placeholder={systemRef?.max?.toString() || "-"}
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full mt-2">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Macro Editor Dialog */}
      <Dialog open={macroEditorOpen} onOpenChange={setMacroEditorOpen}>
        <DialogContent className="max-w-md bg-[#0c0c0c] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Optimize Macro Ratios
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Energy Target */}
            <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    Daily Energy Goal
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={macroEditState.energy}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMacroEditState((s) =>
                          syncMacros("energy", { ...s, energy: val }),
                        );
                      }}
                      className="w-24 font-mono font-bold text-lg border-primary/20 bg-black/40"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      kcal
                    </span>
                  </div>
                </div>

                {goals["weight"]?.target && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] uppercase font-black bg-primary/5 border-primary/20 hover:bg-primary/20 h-8"
                    onClick={() => {
                      const suggested = calculateSuggestedEnergy();
                      setMacroEditState((s) =>
                        syncMacros("energy", { ...s, energy: suggested }),
                      );
                      toast.info("Calories adjusted based on weight goal");
                    }}
                  >
                    Align with Weight Goal
                  </Button>
                )}
              </div>
            </div>

            {/* Macro Sliders/Inputs */}
            <div className="grid gap-4">
              {[
                {
                  key: "carbs",
                  label: "Carbohydrates",
                  color: "bg-blue-500",
                  mult: 4,
                },
                {
                  key: "protein",
                  label: "Protein",
                  color: "bg-primary",
                  mult: 4,
                },
                { key: "fat", label: "Fats", color: "bg-amber-500", mult: 9 },
              ].map((macro) => (
                <div
                  key={macro.key}
                  className="space-y-2 p-3 rounded-lg border border-white/5 bg-white/[0.01]"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-xs font-semibold text-white/70">
                      {macro.label}
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {macro.mult} kcal/g
                    </span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground/50 uppercase font-bold px-1">
                        <span>Grams</span>
                        <span>Ratio</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={(macroEditState as any)[macro.key].g}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMacroEditState((s) =>
                              syncMacros("g", {
                                ...s,
                                [macro.key]: {
                                  ...(s as any)[macro.key],
                                  g: val,
                                },
                              }),
                            );
                          }}
                          className="h-8 font-mono text-sm border-white/10 bg-black/20"
                        />
                        <div className="flex items-center gap-1.5 flex-1 min-w-[80px]">
                          <Input
                            type="number"
                            value={(macroEditState as any)[macro.key].pct}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setMacroEditState((s) =>
                                syncMacros("pct", {
                                  ...s,
                                  [macro.key]: {
                                    ...(s as any)[macro.key],
                                    pct: val,
                                  },
                                }),
                              );
                            }}
                            className="h-8 font-mono text-sm border-primary/20 bg-primary/5 text-primary"
                          />
                          <span className="text-xs font-bold text-primary/60">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Check */}
            <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5">
              <span className="text-xs font-medium text-muted-foreground">
                Total Percentage:
              </span>
              <span
                className={cn(
                  "text-sm font-black font-mono",
                  macroEditState.carbs.pct +
                    macroEditState.protein.pct +
                    macroEditState.fat.pct ===
                    100
                    ? "text-emerald-500"
                    : "text-rose-500",
                )}
              >
                {macroEditState.carbs.pct +
                  macroEditState.protein.pct +
                  macroEditState.fat.pct}
                %
              </span>
            </div>

            <Button
              onClick={handleApplyMacros}
              className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary),0.3)]"
              disabled={
                macroEditState.carbs.pct +
                  macroEditState.protein.pct +
                  macroEditState.fat.pct !==
                100
              }
            >
              Apply Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
