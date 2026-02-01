"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function LoggedFoods({ date }: { date: Date }) {
  const formattedDate = format(date, "yyyy-MM-dd");
  const utils = api.useUtils();

  const { data: logs, isLoading } = api.food.getDailyLogs.useQuery({
    date: formattedDate,
  });

  const deleteLogMutation = api.food.deleteLog.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      void utils.food.getDailyLogs.invalidate();
      void utils.food.getDailyNutrition.invalidate();
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Today's Diary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-background/50 p-3 shadow-sm border border-white/5"
              >
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!logs || logs.length === 0) return null;

  return (
    <Card className="w-full max-w-4xl border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Today's Diary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((log) => {
            const nutrients = log.nutrients as
              | Record<string, number>
              | undefined;
            const energy = nutrients?.["energy_kcal"];

            return (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg bg-background/50 p-3 shadow-sm border border-white/5"
              >
                <div>
                  <div className="font-semibold">{log.foodName}</div>
                  <div className="text-xs text-muted-foreground">
                    {log.quantity} {log.unit} • {log.foodBrand || "Generic"}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    {energy !== undefined && (
                      <span className="font-bold">{energy} kcal</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive opacity-50 hover:opacity-100"
                    onClick={() => deleteLogMutation.mutate({ id: log.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
