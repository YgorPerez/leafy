"use client";

import { useState } from "react";
import { addDays, format, isToday, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { FoodSearch } from "~/app/_components/food-search";
import { LoggedFoods } from "~/app/_components/logged-foods";
import { NutritionTargets } from "~/app/_components/nutrition-targets";
import { ProfileForm } from "~/app/_components/profile-form";
import { WidgetGrid } from "~/app/_components/widgets/widget-grid";
import { useUser } from "~/app/_context/user-context";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";

export function Dashboard() {
  const { metrics, customGoals } = useUser();
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

  // Fetch day statuses for the current month
  const { data: monthDays } = api.day.getMonth.useQuery({
    month: format(date, "yyyy-MM"),
  });

  // Create modifiers for the calendar
  const modifiers = {
    completed:
      monthDays
        ?.filter((day) => day.status === "completed")
        .map((day) => new Date(day.date)) || [],
    logged:
      monthDays
        ?.filter((day) => day.hasLogs && day.status !== "completed")
        .map((day) => new Date(day.date)) || [],
    favorite:
      monthDays
        ?.filter((day) => day.isFavorite)
        .map((day) => new Date(day.date)) || [],
  };

  return (
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
                modifiers={modifiers}
                modifiersClassNames={{
                  completed:
                    "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-green-500 after:rounded-full",
                  logged:
                    "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-500 after:rounded-full",
                  favorite:
                    "font-bold before:content-[''] before:absolute before:top-1 before:right-1 before:w-1 before:h-1 before:bg-yellow-500 before:rounded-full",
                }}
              />
              <div className="border-t p-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Logged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">Favorite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-foreground h-2 w-2 rounded-full opacity-20" />
                    <span className="text-muted-foreground">Today</span>
                  </div>
                </div>
              </div>
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

      {metrics ? (
        <div className="flex w-full flex-col items-center gap-8">
          {/* Widget grid */}
          <WidgetGrid date={date} />

          {/* Existing components */}
          <FoodSearch date={date} />
          <LoggedFoods date={date} />
          <NutritionTargets
            metrics={metrics}
            customGoals={customGoals}
            date={date}
          />
        </div>
      ) : (
        <div className="w-full max-w-lg">
          <ProfileForm />
        </div>
      )}
    </div>
  );
}
