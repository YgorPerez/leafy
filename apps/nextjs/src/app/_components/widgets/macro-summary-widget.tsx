"use client";

import { format } from "date-fns";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { getIntake } from "@acme/api/client";

import { useUser } from "~/app/_context/user-context";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";

const COLORS = {
  protein: "#3b82f6",
  carbs: "#f59e0b",
  fat: "#ef4444",
};

export function MacroSummaryWidget({ date }: { date: Date }) {
  const { metrics, customGoals } = useUser();
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data: intake } = api.food.getDailyNutrition.useQuery({
    date: formattedDate,
  });

  const protein = getIntake(intake, "protein");
  const carbs = getIntake(intake, "carbohydrate");
  const fat = getIntake(intake, "fat");

  const proteinTarget =
    customGoals?.protein?.target ??
    metrics?.nutrients?.protein?.total?.recommended ??
    0;
  const carbTarget =
    customGoals?.carbohydrate?.target ??
    metrics?.nutrients?.carbohydrate?.total?.recommended ??
    0;
  const fatTarget =
    customGoals?.fat?.target ??
    metrics?.nutrients?.fat?.total?.recommended ??
    0;

  const totalCals = protein * 4 + carbs * 4 + fat * 9;

  const pieData = [
    { name: "Protein", value: protein * 4 || 0.1 },
    { name: "Carbs", value: carbs * 4 || 0.1 },
    { name: "Fat", value: fat * 9 || 0.1 },
  ];

  const macros = [
    {
      label: "Protein",
      value: protein,
      target: proteinTarget,
      unit: "g",
      color: COLORS.protein,
    },
    {
      label: "Carbs",
      value: carbs,
      target: carbTarget,
      unit: "g",
      color: COLORS.carbs,
    },
    {
      label: "Fat",
      value: fat,
      target: fatTarget,
      unit: "g",
      color: COLORS.fat,
    },
  ];

  return (
    <Card className="overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wide text-white/60 uppercase">
            Macros
          </h3>
          <span className="text-xs text-white/40">
            {totalCals.toFixed(0)} kcal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-20 w-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={36}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={COLORS.protein} />
                  <Cell fill={COLORS.carbs} />
                  <Cell fill={COLORS.fat} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            {macros.map((m) => (
              <div key={m.label} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <span className="w-12 text-xs text-white/60">{m.label}</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((m.value / (m.target || 1)) * 100, 100)}%`,
                      backgroundColor: m.color,
                    }}
                  />
                </div>
                <span className="w-16 text-right font-mono text-xs text-white/80">
                  {m.value.toFixed(0)}/{m.target.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
