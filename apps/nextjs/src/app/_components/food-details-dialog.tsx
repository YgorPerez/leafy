"use client";

import { useState } from "react";
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
import { useFoodNutrients } from "../_hooks/use-food-nutrients";
import { useResolvedTargets } from "../_hooks/use-resolved-targets";
import { MacroDistribution } from "./food-details/macro-distribution";
import { NutrientProgress } from "./food-details/nutrient-progress";

interface FoodDetailsDialogProps {
  foodCode: string | null;
  dataSource: "foundation" | "branded";
  isOpen: boolean;
  onClose: () => void;
}

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

  const { resolveTarget } = useResolvedTargets(metrics, customGoals);

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
                <MacroDistribution
                  calories={0}
                  isLoading={true}
                  macroData={[]}
                />
                <NutrientProgress
                  isLoading={true}
                  nutrients={[]}
                  resolveTarget={resolveTarget}
                  servingSize={servingSize}
                />
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
                {/* Macro Distribution */}
                <MacroDistribution calories={calories} macroData={macroData} />

                {/* main Nutrients Progress */}
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
                  <NutrientProgress
                    nutrients={nutrients}
                    resolveTarget={resolveTarget}
                    servingSize={servingSize}
                  />
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
