"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { cn } from "~/lib/utils";

interface DashboardProps {
  metrics: DRIMetrics | null;
  customGoals?: Record<string, number>;
  session: any;
}

export function Dashboard({ metrics, customGoals, session }: DashboardProps) {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">
          Viewing: {format(date, "PPP")}
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
