"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(meal.name);
  const [editTime, setEditTime] = useState(
    meal.loggedAt ? format(new Date(meal.loggedAt), "HH:mm") : "",
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const updateMealMutation = api.meal.update.useMutation({
    onSuccess: () => {
      toast.success("Meal updated");
      setIsEditing(false);
      void utils.meal.getDailyMeals.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update meal");
    },
  });

  const handleSaveMeal = () => {
    const updates: { id: string; name?: string; loggedAt?: string } = {
      id: meal.id,
    };

    if (editName !== meal.name) {
      updates.name = editName;
    }

    const originalTime = meal.loggedAt
      ? format(new Date(meal.loggedAt), "HH:mm")
      : "";
    if (editTime !== originalTime && meal.loggedAt) {
      const base = new Date(meal.loggedAt);
      const [hours, minutes] = editTime.split(":").map(Number);
      base.setHours(hours!, minutes!, 0, 0);
      updates.loggedAt = base.toISOString();
    }

    updateMealMutation.mutate(updates);
  };

  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(meal.name);
    setEditTime(
      meal.loggedAt ? format(new Date(meal.loggedAt), "HH:mm") : "",
    );
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

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
          {isEditing && meal.id !== "ungrouped" ? (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                ref={nameInputRef}
                className="border-primary/40 bg-background h-8 w-36 text-sm font-bold"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveMeal();
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <Input
                className="border-primary/40 bg-background h-8 w-24 text-sm"
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveMeal();
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={handleSaveMeal}
                disabled={updateMealMutation.isPending}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg leading-none font-bold">{meal.name}</h3>
                <p className="text-muted-foreground text-xs">
                  {meal.loggedAt
                    ? format(new Date(meal.loggedAt), "h:mm a")
                    : "Time unknown"}
                </p>
              </div>
              {meal.id !== "ungrouped" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary h-7 w-7"
                  onClick={handleStartEditing}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
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
                {meal.nutrients.alcohol > 0 && (
                  <> • {formatMacro(meal.nutrients.alcohol)}a</>
                )}
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
