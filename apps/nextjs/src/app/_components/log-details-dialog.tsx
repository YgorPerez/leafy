"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { CanonicalNutrientKey } from "@acme/api/client";
import { NUTRIENT_REGISTRY } from "@acme/api/client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import { api } from "~/trpc/react";
import { useUser } from "../_context/user-context";
import { useResolvedTargets } from "../_hooks/use-resolved-targets";
import { MacroDistribution } from "./food-details/macro-distribution";
import { NutrientProgress } from "./food-details/nutrient-progress";

const MACRO_COLORS = {
  protein: "#ef4444", // red-500
  carbs: "#eab308", // yellow-500
  fat: "#22c55e", // green-500
};

interface LogEntry {
  id: string;
  foodName: string;
  foodBrand: string | null;
  quantity: number;
  unit: string;
  nutrients: Record<string, number> | null;
}

interface LogDetailsDialogProps {
  log: LogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LogDetailsDialog({
  log,
  isOpen,
  onClose,
}: LogDetailsDialogProps) {
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<string>("g");
  const { metrics, customGoals } = useUser();
  const utils = api.useUtils();

  const updateMutation = api.food.updateLog.useMutation({
    onSuccess: () => {
      toast.success("Entry updated");
      void utils.food.getDailyLogs.invalidate();
      void utils.food.getDailyNutrition.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update entry");
    },
  });

  // Initialize from log when it changes
  useEffect(() => {
    if (log) {
      setQuantity(log.quantity);
      setUnit(log.unit);
    }
  }, [log]);

  const scalingFactor = log ? quantity / log.quantity : 1;

  const nutrients = useMemo(() => {
    if (!log?.nutrients) return [];

    return Object.entries(log.nutrients)
      .map(([key, baseValue]) => {
        const canonicalKey =
          key in NUTRIENT_REGISTRY ? (key as CanonicalNutrientKey) : undefined;
        const metadata = canonicalKey ? NUTRIENT_REGISTRY[canonicalKey] : null;

        const scaledValue = baseValue * scalingFactor;

        return {
          key: canonicalKey,
          name: metadata?.label || key,
          value: scaledValue,
          unit: metadata?.unit || "g",
          baseValue,
        };
      })
      .filter((n) => n.baseValue !== 0);
  }, [log, scalingFactor]);

  const macroData = useMemo(() => {
    const findValue = (key: CanonicalNutrientKey) =>
      nutrients.find((n) => n.key === key)?.value || 0;

    const protein = findValue("protein");
    const carbs = findValue("carbohydrate");
    const fat = findValue("fat");

    if (protein === 0 && carbs === 0 && fat === 0) return [];

    return [
      { name: "Protein", value: protein, color: MACRO_COLORS.protein },
      { name: "Carbs", value: carbs, color: MACRO_COLORS.carbs },
      { name: "Fat", value: fat, color: MACRO_COLORS.fat },
    ].filter((d) => d.value > 0);
  }, [nutrients]);

  const calories = useMemo(() => {
    return nutrients.find((n) => n.key === "energy")?.value || 0;
  }, [nutrients]);

  const { resolveTarget } = useResolvedTargets(metrics, customGoals);

  const handleSave = () => {
    if (!log) return;

    updateMutation.mutate({
      id: log.id,
      quantity,
      unit,
    });
  };

  const hasChanges = log && (quantity !== log.quantity || unit !== log.unit);

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="max-h-[95vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">
                {log?.foodName || "Food Details"}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-2">
                  {log?.foodBrand && (
                    <span className="text-primary font-medium">
                      {log.foodBrand}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </div>

            {log && (
              <div className="bg-secondary/30 flex items-center gap-2 self-start rounded-lg p-2 sm:self-auto">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground px-1 text-[10px] font-bold uppercase">
                    Serving Size
                  </span>
                  <div className="flex items-center gap-1">
                    <Input
                      className="border-primary/40 bg-background focus-visible:ring-primary h-8 w-20 font-bold"
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      type="number"
                      value={quantity}
                    />
                    <Select onValueChange={setUnit} value={unit}>
                      <SelectTrigger className="border-primary/20 bg-background h-8 w-16">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {log ? (
          <div className="custom-scrollbar h-full max-h-[75vh] overflow-y-auto p-6 pt-4">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2">
                <Badge
                  className="border-primary/20 bg-primary/10 text-primary"
                  variant="secondary"
                >
                  Logged Entry
                </Badge>
              </div>

              <div className="flex flex-col gap-8">
                {/* Macro Distribution */}
                <MacroDistribution calories={calories} macroData={macroData} />

                {/* Nutrients Progress */}
                <div className="space-y-6">
                  <div className="border-primary/20 flex items-center justify-between border-b-2 pb-2">
                    <h4 className="text-foreground flex items-center gap-2 text-xl font-black">
                      Nutritional Facts
                    </h4>
                    <span className="bg-primary/10 text-primary rounded-full px-3 py-1.5 text-[10px] font-black tracking-widest uppercase">
                      for {quantity}
                      {unit}
                    </span>
                  </div>
                  <NutrientProgress
                    nutrients={nutrients}
                    resolveTarget={resolveTarget}
                    servingSize={quantity}
                  />
                </div>
              </div>

              {/* Save Button */}
              {hasChanges && (
                <div className="border-border/50 flex justify-end border-t pt-4">
                  <Button
                    className="px-8"
                    disabled={updateMutation.isPending}
                    onClick={handleSave}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-60 items-center justify-center italic">
            No entry selected
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
