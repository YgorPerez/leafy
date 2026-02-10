"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DayActionsMenu } from "~/app/_components/day-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { LogDetailsDialog } from "./log-details-dialog";
import { MealCard } from "./meal-card";

interface LogEntry {
  id: string;
  foodName: string;
  foodBrand: string | null;
  quantity: number;
  unit: string;
  loggedAt: Date | string | null;
  nutrients: Record<string, number> | null;
}

export function LoggedFoods({ date }: { date: Date }) {
  const formattedDate = format(date, "yyyy-MM-dd");
  const utils = api.useUtils();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const { data: meals, isLoading } = api.meal.getDailyMeals.useQuery({
    date: formattedDate,
  });

  const deleteLogMutation = api.food.deleteLog.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      void utils.meal.getDailyMeals.invalidate();
      void utils.food.getDailyNutrition.invalidate();
      void utils.day.getMonth.invalidate();
    },
  });

  const deleteMealMutation = api.meal.delete.useMutation({
    onSuccess: () => {
      toast.success("Meal deleted");
      void utils.meal.getDailyMeals.invalidate();
      void utils.food.getDailyNutrition.invalidate();
      void utils.day.getMonth.invalidate();
    },
  });

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5 w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-primary text-xl">Today's Diary</CardTitle>
          <DayActionsMenu date={date} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full rounded-md" />
                <div className="space-y-1 pl-4">
                  <Skeleton className="h-8 w-11/12" />
                  <Skeleton className="h-8 w-11/12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl space-y-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-primary text-2xl font-bold">Today's Diary</h2>
          <DayActionsMenu date={date} />
        </div>

        {(!meals || meals.length === 0) && (
          <Card className="border-primary/20 bg-primary/5 border-dashed">
            <CardContent className="text-muted-foreground py-12 text-center">
              No meals logged yet. Start by adding a food!
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {meals?.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onDeleteLog={(id) => deleteLogMutation.mutate({ id })}
              onDeleteMeal={(id) => deleteMealMutation.mutate({ id })}
              onLogClick={(log) =>
                setSelectedLog({
                  id: log.id,
                  foodName: log.foodName,
                  foodBrand: log.foodBrand,
                  quantity: log.quantity,
                  unit: log.unit,
                  loggedAt: log.loggedAt,
                  nutrients: (log.nutrients as Record<string, number>) ?? null,
                })
              }
            />
          ))}
        </div>
      </div>

      <LogDetailsDialog
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
