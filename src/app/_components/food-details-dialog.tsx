"use client";

import { useState } from "react";
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
import {
  getClinicalValue,
  normalizeToCanonicalKey,
} from "~/lib/nutrients/registry";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useFoodNutrients } from "../_hooks/use-food-nutrients";

interface FoodDetailsDialogProps {
  foodCode: string | null;
  dataSource: "foundation" | "branded";
  isOpen: boolean;
  onClose: () => void;
}

// (Moved MACRO_COLORS to use-food-nutrients.ts)

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

  const { nutrients, macroData, calories } = useFoodNutrients(
    food ?? undefined,
    servingSize,
  );

  // Helper to map nutrient names to DRI keys
  const getDailyTarget = (nutrientName: string): number | null => {
    if (!metrics) return null;

    const canonicalKey = normalizeToCanonicalKey(nutrientName);
    if (!canonicalKey) return null;

    // Check custom goals first
    const customGoal = customGoals?.[canonicalKey]?.target;
    if (customGoal !== undefined) return customGoal;

    // Fallback to clinical DRI
    return getClinicalValue(metrics, canonicalKey);
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
                    <Skeleton className="mt-1 h-4 w-40" />
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
              <div className="flex items-center gap-2 self-start rounded-lg bg-secondary/30 p-2 sm:self-auto">
                <div className="flex flex-col gap-1">
                  <span className="px-1 font-bold text-[10px] text-muted-foreground uppercase">
                    Serving Size
                  </span>
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-8 w-20 border-primary/40 bg-background font-bold focus-visible:ring-primary"
                      onChange={(e) => setServingSize(Number(e.target.value))}
                      type="number"
                      value={servingSize}
                    />
                    <Select onValueChange={setServingUnit} value={servingUnit}>
                      <SelectTrigger className="h-8 w-16 border-primary/20 bg-background">
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
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Skeleton className="h-48 w-full rounded-xl" />
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
              </div>
            </div>
          </div>
        ) : food ? (
          <div className="custom-scrollbar h-full max-h-[75vh] overflow-y-auto p-6 pt-4">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2">
                <Badge
                  className="border-primary/20 bg-primary/10 text-primary"
                  variant="secondary"
                >
                  {food.source || "Database"}
                </Badge>
                {food.nutriscore_grade && (
                  <Badge
                    className={cn(
                      "border-none text-white uppercase",
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
                    className="border-orange-500/50 bg-orange-50/50 text-orange-600"
                    variant="outline"
                  >
                    NOVA {food.nova_group}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-8">
                {/* Macro Chart */}
                <div className="flex flex-col items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 p-6 shadow-sm">
                  <h4 className="mb-6 font-black text-primary text-sm uppercase tracking-widest">
                    Macro Distribution
                  </h4>
                  <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2">
                    <div className="group/chart relative h-56 w-full">
                      {macroData.length > 0 ? (
                        <>
                          <ResponsiveContainer height="100%" width="100%">
                            <PieChart>
                              <Pie
                                cx="50%"
                                cy="50%"
                                data={macroData}
                                dataKey="value"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={5}
                                stroke="none"
                              >
                                {macroData.map((entry, index) => (
                                  <Cell
                                    fill={entry.color}
                                    key={`cell-${index}`}
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
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500 group-hover/chart:scale-105">
                            <div className="absolute flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-primary/20 bg-background shadow-md">
                              <span className="font-black text-3xl text-foreground leading-none">
                                {calories.toFixed(0)}
                              </span>
                              <span className="mt-1 font-black text-[10px] text-primary uppercase tracking-widest">
                                kcal
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center font-bold text-foreground/70 text-sm italic">
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
                            className="flex items-center justify-between rounded-xl border-2 border-primary/10 bg-background p-3.5 shadow-sm"
                            key={i}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="h-3.5 w-3.5 rounded-full shadow-sm ring-2 ring-primary/5"
                                style={{ backgroundColor: macro.color }}
                              />
                              <span className="font-black text-foreground text-sm">
                                {macro.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-black font-mono text-foreground text-sm">
                                {macro.value.toFixed(1)}g
                              </div>
                              <div className="font-black text-[10px] text-primary uppercase tracking-tighter">
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
                  <div className="flex items-center justify-between border-primary/20 border-b-2 pb-2">
                    <h4 className="flex items-center gap-2 font-black text-foreground text-xl">
                      Nutritional Facts
                    </h4>
                    <span className="rounded-full bg-primary/10 px-3 py-1.5 font-black text-[10px] text-primary uppercase tracking-widest">
                      for {servingSize}
                      {servingUnit}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-x-12 gap-y-7 md:grid-cols-2">
                    {nutrients.map((n, i) => {
                      const isMacro = ["protein", "carbohydrate", "fat"].some(
                        (m) => n.name.toLowerCase().includes(m),
                      );

                      const dailyTarget = getDailyTarget(n.name);
                      // If target exists, use it for max value (capped at reasonable progress).
                      // Otherwise fall back to arbitrary scale.

                      let progressValue = 0;
                      const progressMax = 100;

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
                                  {Math.round((n.value / dailyTarget) * 100)}%
                                  of daily goal
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
                              n.name.toLowerCase().includes("fat") &&
                                "[&>div]:bg-green-500",
                            )}
                            value={Math.min(progressValue, 100)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {food.ingredients_text && food.ingredients_text.length > 0 && (
                <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-4">
                  <h4 className="font-bold text-primary text-sm uppercase">
                    Ingredients
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {food.ingredients_text[0]?.text}
                  </p>
                </div>
              )}

              {food.allergens_tags && food.allergens_tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-primary text-sm uppercase">
                    Allergens
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {food.allergens_tags.map((tag: string) => (
                      <Badge
                        className="border-red-200 bg-red-50 font-medium text-red-600 capitalize hover:bg-red-100"
                        key={tag}
                        variant="destructive"
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
