"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Minus, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

import { useUser } from "~/app/_context/user-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export function WeightTrendWidget({ date }: { date: Date }) {
  const { metrics } = useUser();
  const [open, setOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const utils = api.useUtils();

  const { data: history } = api.food.getWeightHistory.useQuery({ days: 30 });

  const logWeight = api.food.logWeight.useMutation({
    onSuccess: () => {
      void utils.food.getWeightHistory.invalidate();
      setOpen(false);
      setWeightInput("");
    },
  });

  const chartData = history?.slice().reverse() ?? [];
  const currentWeight = history?.[0]?.weight ?? metrics?.weight ?? null;
  const previousWeight = history?.[1]?.weight ?? null;

  let trend: "up" | "down" | "stable" = "stable";
  if (currentWeight && previousWeight) {
    const diff = currentWeight - previousWeight;
    if (diff > 0.1) trend = "up";
    else if (diff < -0.1) trend = "down";
  }

  const handleLogWeight = () => {
    const weight = parseFloat(weightInput);
    if (!isNaN(weight) && weight > 0) {
      logWeight.mutate({
        date: format(date, "yyyy-MM-dd"),
        weight,
      });
    }
  };

  return (
    <Card className="overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wide text-white/60 uppercase">
            Weight
          </h3>
          <span className="text-xs text-white/40">
            {history?.length ?? 0} entries
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-16 flex-1">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={
                      trend === "down"
                        ? "#22c55e"
                        : trend === "up"
                          ? "#f59e0b"
                          : "#8b5cf6"
                    }
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/30">
                Not enough data
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">
                {currentWeight?.toFixed(1) ?? "—"}
              </span>
              <span className="text-sm text-white/40">kg</span>
              {trend === "up" && (
                <TrendingUp className="h-4 w-4 text-amber-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              {trend === "stable" && (
                <Minus className="h-4 w-4 text-purple-400" />
              )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-white/10 bg-white/5 text-xs hover:bg-purple-500/20"
                >
                  <Scale className="mr-1 h-3 w-3" />
                  Log
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[320px]">
                <DialogHeader>
                  <DialogTitle>Log Weight</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Weight in kg"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">kg</span>
                  </div>
                  <Button
                    onClick={handleLogWeight}
                    disabled={logWeight.isPending || !weightInput}
                  >
                    {logWeight.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
