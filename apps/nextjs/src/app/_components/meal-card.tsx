"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { type RouterOutputs } from "~/trpc/react";

type Meal = RouterOutputs["meal"]["getDailyMeals"][number];

interface MealCardProps {
  meal: Meal;
  onDeleteLog: (logId: string) => void;
  onDeleteMeal: (mealId: string) => void;
  onLogClick: (log: Meal["logs"][number]) => void;
}

export function MealCard({
  meal,
  onDeleteLog,
  onDeleteMeal,
  onLogClick,
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper to format macros
  const formatMacro = (val: number) => Math.round(val);

  // DIASS Color logic
  const getDiassColor = (score: number, reliability: string) => {
    if (reliability === "low") return "bg-gray-400";
    if (score >= 100) return "bg-green-500";
    if (score >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="border-primary/20 bg-primary/5 mb-4 overflow-hidden">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between p-4 transition-colors hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-background/80 rounded-md p-2 transition-transform duration-200">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-lg leading-none font-bold">{meal.name}</h3>
            <p className="text-muted-foreground text-xs">
              {meal.loggedAt
                ? format(new Date(meal.loggedAt), "h:mm a")
                : "Time unknown"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Macros Summary */}
          <div className="hidden items-center gap-3 text-sm sm:flex">
            <div className="flex flex-col items-end">
              <span className="font-bold">
                {Math.round(meal.nutrients.calories)} kcal
              </span>
              <span className="text-muted-foreground text-xs">
                {formatMacro(meal.nutrients.protein)}p •{" "}
                {formatMacro(meal.nutrients.carbs)}c •{" "}
                {formatMacro(meal.nutrients.fat)}f
              </span>
            </div>
          </div>

          {/* DIASS Badge */}
          {meal.diass && meal.diass.reliability !== "low" && (
            <Badge
              className={cn(
                "hover:bg-opacity-80 ml-2 cursor-help transition-colors",
                getDiassColor(meal.diass.score, meal.diass.reliability),
              )}
              title={`Limiting AA: ${meal.diass.limitingAminoAcid || "None"}`}
            >
              DIASS: {Math.round(meal.diass.score)}
            </Badge>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="bg-background/20 border-t border-white/10 p-0">
          <div className="divide-y divide-white/5">
            {meal.logs.map((log) => (
              <div
                key={log.id}
                className="group flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-white/5"
                onClick={() => onLogClick(log)}
              >
                <div className="flex-1">
                  <div className="font-medium">{log.foodName}</div>
                  <div className="text-muted-foreground text-xs">
                    {log.quantity} {log.unit}{" "}
                    {log.foodBrand && `• ${log.foodBrand}`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {Math.round(
                      (log.nutrients as Record<string, number>)?.["energy"] ||
                        0,
                    )}{" "}
                    kcal
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLog(log.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {meal.logs.length === 0 && (
              <div className="text-muted-foreground p-4 text-center text-sm">
                Empty meal
              </div>
            )}

            <div className="flex justify-end bg-black/10 p-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm("Are you sure you want to delete this entire meal?")
                  ) {
                    onDeleteMeal(meal.id);
                  }
                }}
              >
                Delete Meal
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
