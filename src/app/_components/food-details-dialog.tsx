"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useUser } from "~/app/_context/user-context";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface FoodDetailsDialogProps {
  foodCode: string | null;
  dataSource: "foundation" | "branded";
  isOpen: boolean;
  onClose: () => void;
}

const MACRO_COLORS = {
  protein: "#ef4444", // red-500
  carbs: "#eab308", // yellow-500
  fat: "#22c55e", // green-500
};

export function FoodDetailsDialog({
  foodCode,
  dataSource,
  isOpen,
  onClose,
}: FoodDetailsDialogProps) {
  const [servingSize, setServingSize] = useState<number>(100);
  const [servingUnit, setServingUnit] = useState<string>("g");
  const { metrics, customGoals } = useUser();

  const { data: food, isLoading } = api.food.getById.useQuery(
    { id: foodCode!, dataSource },
    { enabled: !!foodCode && isOpen },
  );

  const scalingFactor = servingSize / 100;

  const nutrients = useMemo(() => {
    if (!food || !food.nutriments) return [];

    // Backend now ensures consistent Nutriment[] format
    return food.nutriments
      .map((n) => {
        // n is already typed as Nutriment from TRPC
        // Prefer 100g value for base, fallback to value
        const baseValue = n["100g"] ?? n.value ?? 0;

        return {
          name: n.name || "Unknown",
          value: Number(baseValue) * scalingFactor,
          unit: n.unit || "g",
          baseValue: baseValue,
        };
      })
      .filter(
        (n) =>
          n.baseValue !== null &&
          n.baseValue !== undefined &&
          n.baseValue !== 0,
      );
  }, [food, scalingFactor]);

  const macroData = useMemo(() => {
    const findValue = (name: string) =>
      nutrients.find((n) => n.name === name)?.value || 0;

    // Use exact keys from our normalized set
    const protein = findValue("Protein");
    const carbs = findValue("Carbohydrate, by difference");
    const fat = findValue("Total lipid (fat)");

    if (protein === 0 && carbs === 0 && fat === 0) return [];

    return [
      { name: "Protein", value: protein, color: MACRO_COLORS.protein },
      { name: "Carbs", value: carbs, color: MACRO_COLORS.carbs },
      { name: "Fat", value: fat, color: MACRO_COLORS.fat },
    ].filter((d) => d.value > 0);
  }, [nutrients]);
  const calories = useMemo(() => {
    return nutrients.find((n) => n.name === "Energy")?.value || 0;
  }, [nutrients]);

  // Helper to map nutrient names to DRI keys
  const getDailyTarget = (nutrientName: string): number | null => {
    if (!metrics) return null;

    // Use strict key type matching DRIMetrics keys
    const normalizedName = nutrientName.toLowerCase();

    const getGoal = (key: string) => customGoals?.[key]?.target;

    // --- CARBOHYDRATE GROUP ---
    if (normalizedName.includes("carbohydrate")) {
      const g = getGoal("carbohydrate");
      if (g !== undefined) return g;
      return metrics.nutrients.carbohydrate.total.recommended;
    }

    // Fiber
    if (normalizedName === "fiber" || normalizedName === "total fiber") {
      const g = getGoal("fiber");
      if (g !== undefined) return g;
      return metrics.nutrients.carbohydrate.fiber.total.recommended;
    }
    if (normalizedName === "soluble fiber")
      return metrics.nutrients.carbohydrate.fiber.soluble.recommended;
    if (normalizedName === "insoluble fiber")
      return metrics.nutrients.carbohydrate.fiber.insoluble.recommended;

    // Starch
    if (normalizedName === "starch")
      return metrics.nutrients.carbohydrate.starch.recommended;

    // Sugars
    if (
      normalizedName === "sugar" ||
      normalizedName === "sugars, total" ||
      normalizedName === "total sugars"
    ) {
      return metrics.nutrients.carbohydrate.sugar.total.recommended;
    }
    if (
      normalizedName === "added sugars" ||
      normalizedName === "sugars, added" ||
      normalizedName === "addedSugar"
    ) {
      return metrics.nutrients.carbohydrate.sugar.added.recommended;
    }
    if (normalizedName.includes("sugar alcohol"))
      return metrics.nutrients.carbohydrate.sugar.alcohol.recommended;
    if (normalizedName === "sucrose")
      return metrics.nutrients.carbohydrate.sugar.sucrose.recommended;
    if (normalizedName === "glucose")
      return metrics.nutrients.carbohydrate.sugar.glucose.recommended;
    if (normalizedName === "fructose")
      return metrics.nutrients.carbohydrate.sugar.fructose.recommended;
    if (normalizedName === "lactose")
      return metrics.nutrients.carbohydrate.sugar.lactose.recommended;
    if (normalizedName === "maltose")
      return metrics.nutrients.carbohydrate.sugar.maltose.recommended;
    if (normalizedName === "galactose")
      return metrics.nutrients.carbohydrate.sugar.galactose.recommended;

    // --- PROTEIN GROUP ---
    if (normalizedName === "protein") {
      const g = getGoal("protein");
      if (g !== undefined) return g;
      return metrics.nutrients.protein.total.recommended;
    }
    // Amino Acids
    if (normalizedName === "alanine")
      return metrics.nutrients.protein.alanine.recommended;
    if (normalizedName === "arginine")
      return metrics.nutrients.protein.arginine.recommended;
    if (normalizedName === "aspartic acid" || normalizedName === "asparticacid")
      return metrics.nutrients.protein.asparticAcid.recommended; // Catch variations
    if (normalizedName === "cystine")
      return metrics.nutrients.protein.cystine.recommended;
    if (normalizedName === "glutamic acid" || normalizedName === "glutamicacid")
      return metrics.nutrients.protein.glutamicAcid.recommended;
    if (normalizedName === "glutamine")
      return metrics.nutrients.protein.glutamine.recommended;
    if (normalizedName === "glycine")
      return metrics.nutrients.protein.glycine.recommended;
    if (normalizedName === "histidine")
      return metrics.nutrients.protein.histidine.recommended;
    if (normalizedName === "hydroxyproline")
      return metrics.nutrients.protein.hydroxyproline.recommended;
    if (normalizedName === "isoleucine")
      return metrics.nutrients.protein.isoleucine.recommended;
    if (normalizedName === "leucine")
      return metrics.nutrients.protein.leucine.recommended;
    if (normalizedName === "lysine")
      return metrics.nutrients.protein.lysine.recommended;
    if (normalizedName === "methionine")
      return metrics.nutrients.protein.methionine.recommended;
    if (normalizedName === "phenylalanine")
      return metrics.nutrients.protein.phenylalanine.recommended;
    if (normalizedName === "proline")
      return metrics.nutrients.protein.proline.recommended;
    if (normalizedName === "serine")
      return metrics.nutrients.protein.serine.recommended;
    if (normalizedName === "threonine")
      return metrics.nutrients.protein.threonine.recommended;
    if (normalizedName === "tryptophan")
      return metrics.nutrients.protein.tryptophan.recommended;
    if (normalizedName === "tyrosine")
      return metrics.nutrients.protein.tyrosine.recommended;
    if (normalizedName === "valine")
      return metrics.nutrients.protein.valine.recommended;

    // --- FAT GROUP ---
    if (
      normalizedName === "total fat" ||
      (normalizedName.includes("fat") &&
        !normalizedName.includes("saturated") &&
        !normalizedName.includes("trans"))
    ) {
      const g = getGoal("fat");
      if (g !== undefined) return g;
      return metrics.nutrients.fat.total.recommended;
    }
    if (normalizedName.includes("saturated fat"))
      return metrics.nutrients.fat.saturated.recommended;
    if (normalizedName.includes("trans fat"))
      return metrics.nutrients.fat.trans.recommended;
    if (normalizedName.includes("monounsaturated"))
      return metrics.nutrients.fat.monounsaturated.recommended;
    if (normalizedName.includes("polyunsaturated"))
      return metrics.nutrients.fat.polyunsaturated.recommended;
    if (
      normalizedName.includes("omega-3") ||
      normalizedName.includes("alpha-linolenic")
    )
      return metrics.nutrients.fat.omega3.recommended;
    if (
      normalizedName.includes("omega-6") ||
      normalizedName.includes("linoleic")
    )
      return metrics.nutrients.fat.omega6.recommended;
    if (normalizedName.includes("cholesterol"))
      return metrics.nutrients.fat.cholesterol.recommended;

    // --- VITAMINS & MINERALS (Flat structure) ---
    let key:
      | keyof Omit<
          NonNullable<typeof metrics>["nutrients"],
          "carbohydrate" | "protein" | "fat"
        >
      | null = null;

    if (normalizedName.includes("calcium")) key = "calcium";
    else if (normalizedName.includes("iron")) key = "iron";
    else if (normalizedName.includes("potassium")) key = "potassium";
    else if (normalizedName.includes("sodium")) key = "sodium";
    else if (normalizedName.includes("vitamin a")) key = "vitaminA";
    else if (normalizedName.includes("vitamin c")) key = "vitaminC";
    else if (normalizedName.includes("vitamin d")) key = "vitaminD";
    else if (normalizedName.includes("vitamin e")) key = "vitaminE";
    else if (normalizedName.includes("vitamin k")) key = "vitaminK";
    else if (normalizedName.includes("magnesium")) key = "magnesium";
    else if (normalizedName.includes("zinc")) key = "zinc";

    if (key) {
      // Check custom goals first
      // Assuming customGoals still uses flat keys for vitamins/minerals
      if (customGoals && (customGoals as any)[key] !== undefined) {
        const goal = (customGoals as any)[key];
        // Handle migration gracefully: if it's an object, take .target, else take the number
        if (typeof goal === "object" && goal !== null) {
          return goal.target ?? (goal as any).recommended ?? null;
        }
        return goal;
      }
      // Fallback to DRI
      const nutrient = metrics.nutrients[key];
      // Type guard to ensure we are accessing a NutrientValue (which has recommended), though the Omit above helps.
      // With the new schema, remaining keys are NutrientValue.
      return (nutrient as any)?.recommended ?? null;
    }

    return null;
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="max-h-[95vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">
                {isLoading ? (
                  <Skeleton className="h-7 w-64" />
                ) : (
                  food?.product_name?.[0]?.text || "Food Details"
                )}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-2">
                  {isLoading ? (
                    <Skeleton className="h-4 w-40 mt-1" />
                  ) : (
                    <>
                      {food?.brands && (
                        <span className="font-medium text-primary">
                          {food.brands}
                        </span>
                      )}
                      {food?.quantity && (
                        <span className="text-muted-foreground">
                          {" "}
                          • {food.quantity}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </DialogDescription>
            </div>

            {!isLoading && food && (
              <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg self-start sm:self-auto">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
                    Serving Size
                  </span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={servingSize}
                      onChange={(e) => setServingSize(Number(e.target.value))}
                      className="w-20 h-8 bg-background border-primary/40 focus-visible:ring-primary font-bold"
                    />
                    <Select value={servingUnit} onValueChange={setServingUnit}>
                      <SelectTrigger className="w-16 h-8 bg-background border-primary/20">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="h-full max-h-[75vh] overflow-y-auto p-6 pt-2">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-48 w-full rounded-xl" />
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : food ? (
          <div className="h-full max-h-[75vh] overflow-y-auto p-6 pt-4 custom-scrollbar">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {food.source || "Database"}
                </Badge>
                {food.nutriscore_grade && (
                  <Badge
                    className={cn(
                      "uppercase text-white border-none",
                      food.nutriscore_grade === "a"
                        ? "bg-green-600"
                        : food.nutriscore_grade === "b"
                          ? "bg-lime-500"
                          : food.nutriscore_grade === "c"
                            ? "bg-yellow-500 text-black"
                            : food.nutriscore_grade === "d"
                              ? "bg-orange-500"
                              : "bg-red-500",
                    )}
                  >
                    Nutri-Score {food.nutriscore_grade}
                  </Badge>
                )}
                {food.nova_group && (
                  <Badge
                    variant="outline"
                    className="border-orange-500/50 text-orange-600 bg-orange-50/50"
                  >
                    NOVA {food.nova_group}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-8">
                {/* Macro Chart */}
                <div className="flex flex-col items-center justify-center p-6 bg-primary/10 rounded-3xl border border-primary/20 shadow-sm">
                  <h4 className="text-sm font-black text-primary uppercase mb-6 tracking-widest">
                    Macro Distribution
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
                    <div className="h-56 w-full relative group/chart">
                      {macroData.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={macroData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {macroData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                                  backgroundColor: "hsl(var(--background))",
                                  fontWeight: "bold",
                                }}
                                formatter={(
                                  value: number | string | undefined,
                                  name: string | undefined,
                                ) => {
                                  const val = Number(value);
                                  const total = macroData.reduce(
                                    (acc, curr) => acc + curr.value,
                                    0,
                                  );
                                  const percentage = (
                                    (val / total) *
                                    100
                                  ).toFixed(1);
                                  return [
                                    `${val.toFixed(1)}g (${percentage}%)`,
                                    name,
                                  ];
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Centered Calories */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-transform duration-500 group-hover/chart:scale-105">
                            <div className="absolute w-24 h-24 rounded-full border-2 border-primary/20 bg-background flex flex-col items-center justify-center shadow-md">
                              <span className="text-3xl font-black text-foreground leading-none">
                                {calories.toFixed(0)}
                              </span>
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                                kcal
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center text-foreground/70 font-bold text-sm italic">
                          No macro data available
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      {macroData.map((macro, i) => {
                        const total = macroData.reduce(
                          (acc, curr) => acc + curr.value,
                          0,
                        );
                        const percentage = (
                          (macro.value / total) *
                          100
                        ).toFixed(1);
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3.5 bg-background rounded-xl border-2 border-primary/10 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3.5 h-3.5 rounded-full ring-2 ring-primary/5 shadow-sm"
                                style={{ backgroundColor: macro.color }}
                              />
                              <span className="font-black text-sm text-foreground">
                                {macro.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm font-black text-foreground">
                                {macro.value.toFixed(1)}g
                              </div>
                              <div className="text-[10px] text-primary font-black uppercase tracking-tighter">
                                {percentage}% of macros
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Main Nutrients Progress */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-primary/20 pb-2">
                    <h4 className="font-black text-xl flex items-center gap-2 text-foreground">
                      Nutritional Facts
                    </h4>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                      for {servingSize}
                      {servingUnit}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
                    {nutrients.map((n, i) => {
                      const isMacro = ["protein", "carbohydrate", "fat"].some(
                        (m) => n.name.toLowerCase().includes(m),
                      );

                      const dailyTarget = getDailyTarget(n.name);
                      // If target exists, use it for max value (capped at reasonable progress).
                      // Otherwise fall back to arbitrary scale.

                      let progressValue = 0;
                      let progressMax = 100;

                      if (dailyTarget && dailyTarget > 0) {
                        progressValue = (n.value / dailyTarget) * 100;
                      } else {
                        // Fallback logic
                        const maxVal = isMacro ? servingSize / 2 : 100;
                        progressValue = (n.value / maxVal) * 100;
                      }

                      return (
                        <div key={i} className="space-y-2.5 group">
                          <div className="flex justify-between items-end text-sm">
                            <span className="capitalize font-bold text-foreground group-hover:text-primary transition-colors">
                              {n.name}
                            </span>
                            <div className="flex flex-col items-end">
                              <span className="font-mono font-black bg-primary/5 text-foreground px-3 py-1 rounded-md text-xs border border-primary/10">
                                {n.value.toFixed(1)}{" "}
                                <span className="text-[10px] text-foreground/70 ml-0.5">
                                  {n.unit}
                                </span>
                              </span>
                              {dailyTarget && (
                                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                  {Math.round((n.value / dailyTarget) * 100)}%
                                  of daily goal
                                </span>
                              )}
                            </div>
                          </div>
                          <Progress
                            value={Math.min(progressValue, 100)}
                            className={cn(
                              "h-2.5 bg-primary/10 ring-1 ring-primary/5",
                              n.name.toLowerCase().includes("protein") &&
                                "[&>div]:bg-red-500",
                              n.name.toLowerCase().includes("carbohydrate") &&
                                "[&>div]:bg-yellow-500",
                              n.name.toLowerCase().includes("fat") &&
                                "[&>div]:bg-green-500",
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {food.ingredients_text && food.ingredients_text.length > 0 && (
                <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border/50">
                  <h4 className="font-bold text-sm text-primary uppercase">
                    Ingredients
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {food.ingredients_text[0]?.text}
                  </p>
                </div>
              )}

              {food.allergens_tags && food.allergens_tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-primary uppercase">
                    Allergens
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {food.allergens_tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="destructive"
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 capitalize font-medium"
                      >
                        {tag.replace("en:", "").replace(/-/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-60 items-center justify-center text-muted-foreground italic">
            Food not found in selected database
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
