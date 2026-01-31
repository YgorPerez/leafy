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
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { type DRIMetrics } from "~/lib/clinical-calculator";
import { api } from "~/trpc/react";

export function NutritionTargets({
  metrics,
  customGoals,
  date,
}: {
  metrics: DRIMetrics;
  customGoals?: Record<string, number>;
  date: Date;
}) {
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data: intake, isLoading } = api.food.getDailyNutrition.useQuery({
    date: formattedDate,
  });

  const defaults = metrics.nutrients;
  const [goals, setGoals] = useState<Record<string, number>>(customGoals || {});

  const updateGoalsMutation = api.food.updateGoals.useMutation({
    onSuccess: () => {
      toast.success("Goals updated");
      window.location.reload();
    },
  });

  const handleSave = (key: string, val: number) => {
    const newGoals = { ...goals, [key]: val };
    setGoals(newGoals);
    updateGoalsMutation.mutate({ goals: newGoals });
  };

  const NutrientRow = ({
    itemKey,
    label,
    value,
    isRange,
  }: {
    itemKey: string;
    label: string;
    value: any;
    isRange?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editVal, setEditVal] = useState(
      goals[itemKey] ?? value.recommended ?? 0,
    );

    const isCustomized = goals[itemKey] !== undefined;
    const targetVal = isCustomized ? goals[itemKey] : value.recommended;

    // Intake mapping
    // Some keys might differ between logs and clinical targets
    // e.g. energy_kcal vs tee, proteins vs protein
    let intakeVal = 0;
    if (intake) {
      if (itemKey === "protein")
        intakeVal = intake.protein || intake.proteins || 0;
      else if (itemKey === "carbohydrate")
        intakeVal = intake.carbohydrate || intake.carbohydrates || 0;
      else if (itemKey === "fat") intakeVal = intake.fat || 0;
      else if (itemKey === "fiber") intakeVal = intake.fiber || 0;
      else intakeVal = (intake as any)[itemKey] || 0;
    }

    const progress = targetVal > 0 ? (intakeVal / targetVal) * 100 : 0;

    return (
      <div className="flex flex-col gap-1 border-white/5 border-b py-2 last:border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}</span>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground opacity-50 hover:opacity-100"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Goal: {label}</DialogTitle>
                </DialogHeader>
                <div className="flex gap-4 pt-4">
                  <Input
                    type="number"
                    value={editVal}
                    onChange={(e) => setEditVal(Number(e.target.value))}
                  />
                  <Button
                    onClick={() => {
                      handleSave(itemKey, editVal);
                      setIsOpen(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground mr-2 font-mono">
              {intakeVal.toFixed(intakeVal < 1 ? 2 : 1)} /
            </span>
            <span
              className={`font-mono font-semibold ${
                isCustomized ? "text-primary" : ""
              }`}
            >
              {isRange && !isCustomized && value.min && value.max
                ? `${value.min} - ${value.max}`
                : targetVal}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              {value.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
            {Math.round(progress)}%
          </span>
        </div>

        {isCustomized && (
          <div className="text-[10px] text-muted-foreground italic">
            RDA: {value.recommended} {value.unit}
          </div>
        )}
      </div>
    );
  };

  const energyIntake = intake?.energy_kcal || 0;
  const energyProgress = (energyIntake / metrics.tee) * 100;

  // Skeleton loading UI for nutrient rows
  const NutrientRowSkeleton = () => (
    <div className="flex flex-col gap-1 border-white/5 border-b py-2 last:border-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-1.5 flex-1 rounded-full" />
        <Skeleton className="h-3 w-8" />
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

          {/* Vitamins Skeleton */}
          <div className="space-y-4">
            <h3 className="border-b border-primary/20 pb-2 text-lg font-semibold text-primary">
              Vitamins
            </h3>
            <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <NutrientRowSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Minerals Skeleton */}
          <div className="space-y-4">
            <h3 className="border-b border-primary/20 pb-2 text-lg font-semibold text-primary">
              Minerals
            </h3>
            <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <NutrientRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-background/50 shadow-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <CardContent className="flex flex-col items-center justify-center p-6 text-center relative z-10">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                BMI
              </span>
              <span className="text-3xl font-bold">{metrics.bmi}</span>
            </CardContent>
          </Card>

          <Card className="border-none bg-background/50 shadow-sm overflow-hidden relative group md:col-span-2">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <div
              className="absolute bottom-0 left-0 h-1 bg-primary/30 transition-all duration-1000"
              style={{ width: `${Math.min(energyProgress, 100)}%` }}
            />
            <CardContent className="flex items-center justify-between p-6 relative z-10">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium uppercase text-muted-foreground">
                  Energy Intake
                </span>
                <span className="text-3xl font-bold">
                  {energyIntake.toFixed(0)}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    / {metrics.tee} kcal
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-primary">
                  {Math.round(energyProgress)}%
                </span>
                <span className="text-[10px] text-muted-foreground uppercase">
                  of daily goal
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Macronutrients */}
        <div className="space-y-4">
          <h3 className="border-b border-primary/20 pb-2 text-lg font-semibold text-primary">
            Macronutrients
          </h3>
          <div className="grid gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
            <NutrientRow
              itemKey="carbohydrate"
              label="Carbohydrate"
              value={metrics.nutrients.carbohydrate}
              isRange
            />
            <NutrientRow
              itemKey="fiber"
              label="Total Fiber"
              value={metrics.nutrients.fiber}
            />
            <NutrientRow
              itemKey="protein"
              label="Protein"
              value={metrics.nutrients.protein}
            />
            <NutrientRow
              itemKey="fat"
              label="Fat"
              value={metrics.nutrients.fat}
              isRange
            />
            <NutrientRow
              itemKey="saturatedFat"
              label="Saturated Fat"
              value={metrics.nutrients.saturatedFat}
            />
            <NutrientRow
              itemKey="transFat"
              label="Trans Fat"
              value={metrics.nutrients.transFat}
            />
            <NutrientRow
              itemKey="alphaLinolenicAcid"
              label="α-Linolenic Acid"
              value={metrics.nutrients.alphaLinolenicAcid}
            />
            <NutrientRow
              itemKey="linoleicAcid"
              label="Linoleic Acid"
              value={metrics.nutrients.linoleicAcid}
            />
            <NutrientRow
              itemKey="cholesterol"
              label="Cholesterol"
              value={metrics.nutrients.cholesterol}
            />
            <NutrientRow
              itemKey="water"
              label="Total Water"
              value={metrics.nutrients.water}
            />
          </div>
        </div>

        {/* Vitamins */}
        <div className="space-y-4">
          <h3 className="border-b border-primary/20 pb-2 text-lg font-semibold text-primary">
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
        <div className="space-y-4">
          <h3 className="border-b border-primary/20 pb-2 text-lg font-semibold text-primary">
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
    </Card>
  );
}
