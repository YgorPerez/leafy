"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "~/components/ui/skeleton";

interface MacroData {
  name: string;
  value: number;
  color: string;
}

interface MacroDistributionProps {
  macroData: MacroData[];
  calories: number;
  isLoading?: boolean;
}

export function MacroDistribution({
  macroData,
  calories,
  isLoading,
}: MacroDistributionProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
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
                      <Cell fill={entry.color} key={`cell-${index}`} />
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
                      const percentage = ((val / total) * 100).toFixed(1);
                      return [`${val.toFixed(1)}g (${percentage}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
            const total = macroData.reduce((acc, curr) => acc + curr.value, 0);
            const percentage = ((macro.value / total) * 100).toFixed(1);
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
  );
}
