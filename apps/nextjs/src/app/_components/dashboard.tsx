"use client";

import { useState } from "react";
import { addDays, format, isToday, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { type DRIMetrics } from "@acme/api/client";

import { AuthForm } from "~/app/_components/auth-form";
import { FoodSearch } from "~/app/_components/food-search";
import { LoggedFoods } from "~/app/_components/logged-foods";
import { NutritionTargets } from "~/app/_components/nutrition-targets";
import { ProfileForm } from "~/app/_components/profile-form";
import { UserProvider } from "~/app/_context/user-context";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

interface DashboardProps {
  metrics: DRIMetrics | null;
  customGoals?: Record<string, { target?: number; min?: number; max?: number }>;
  session: {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
    };
  } | null;
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
    <UserProvider metrics={metrics} customGoals={customGoals}>
      <div className="flex w-full flex-col items-center gap-8">
        <div className="bg-card mt-4 flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border px-6 py-4 shadow-sm">
          <div className="flex w-full items-center justify-between">
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
                  className="hover:bg-accent/50 flex h-auto flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all active:scale-95"
                >
                  <span className="text-muted-foreground text-[10px] leading-none font-bold tracking-widest uppercase">
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
              className="text-primary h-4 p-0 text-xs font-medium hover:no-underline"
            >
              Go to Today
            </Button>
          )}
        </div>

        <FoodSearch date={date} />

        {metrics ? (
          <div className="flex w-full flex-col items-center gap-8">
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
    </UserProvider>
  );
}
