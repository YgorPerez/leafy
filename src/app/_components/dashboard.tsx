"use client";

import { addDays, format, isToday, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { AuthForm } from "~/app/_components/auth-form";
import { FoodSearch } from "~/app/_components/food-search";
import { LoggedFoods } from "~/app/_components/logged-foods";
import { NutritionTargets } from "~/app/_components/nutrition-targets";
import { ProfileForm } from "~/app/_components/profile-form";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { type DRIMetrics } from "~/lib/clinical-calculator";

interface DashboardProps {
  metrics: DRIMetrics | null;
  customGoals?: Record<string, number>;
  session: any;
}

export function Dashboard({ metrics, customGoals, session }: DashboardProps) {
  const [date, setDate] = useState<Date>(new Date());

  const prevDay = () => setDate((d) => subDays(d, 1));
  const nextDay = () => {
    const next = addDays(date, 1);
    if (next <= new Date()) {
      setDate(next);
    }
  };
  const goToToday = () => setDate(new Date());

  const isTodayDate = isToday(date);

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 py-4 px-6 bg-card rounded-2xl border shadow-sm w-full max-w-md mt-4">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevDay}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 hover:bg-accent/50 rounded-xl transition-all active:scale-95"
              >
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  {isTodayDate ? "Today" : format(date, "EEEE")}
                </span>
                <span className="text-xl font-bold tracking-tight">
                  {format(date, "MMM d, yyyy")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="center"
              sideOffset={8}
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={{ after: new Date() }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextDay}
            className="h-8 w-8"
            disabled={isTodayDate}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        {!isTodayDate && (
          <Button
            variant="link"
            size="sm"
            onClick={goToToday}
            className="h-4 p-0 text-xs font-medium text-primary hover:no-underline"
          >
            Go to Today
          </Button>
        )}
      </div>

      <FoodSearch date={date} />

      {metrics ? (
        <div className="w-full flex flex-col items-center gap-8">
          <LoggedFoods date={date} />
          <NutritionTargets
            metrics={metrics}
            customGoals={customGoals}
            date={date}
          />
        </div>
      ) : session ? (
        <div className="w-full max-w-lg">
          <ProfileForm />
        </div>
      ) : null}

      {!session && (
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      )}
    </div>
  );
}
