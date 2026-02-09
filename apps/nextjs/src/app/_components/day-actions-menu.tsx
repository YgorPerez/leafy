"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, Copy, MoreHorizontal, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface DayActionsMenuProps {
  date: Date;
}

export function DayActionsMenu({ date }: DayActionsMenuProps) {
  const formattedDate = format(date, "yyyy-MM-dd");
  const utils = api.useUtils();
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>();

  // Queries
  const { data: dayData } = api.day.get.useQuery({ date: formattedDate });

  // Mutations
  const toggleCompletionMutation = api.day.toggleCompletion.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.status === "completed"
          ? "Day marked as completed"
          : "Day marked as active",
      );
      void utils.day.get.invalidate({ date: formattedDate });
      void utils.day.getMonth.invalidate();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const toggleFavoriteMutation = api.day.toggleFavorite.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.isFavorite
          ? "Day added to favorites"
          : "Day removed from favorites",
      );
      void utils.day.get.invalidate({ date: formattedDate });
      void utils.day.getMonth.invalidate();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const copyDayMutation = api.day.copy.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully copied ${data.count} items!`);
      setIsCopyDialogOpen(false);
      // Invalidate target date to refresh if user navigates there
      if (targetDate) {
        void utils.meal.getDailyMeals.invalidate({
          date: format(targetDate, "yyyy-MM-dd"),
        });
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCopy = () => {
    if (!targetDate) {
      toast.error("Please select a date to copy to.");
      return;
    }
    copyDayMutation.mutate({
      fromDate: formattedDate,
      toDate: format(targetDate, "yyyy-MM-dd"),
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {dayData?.isFavorite && (
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        )}
        {dayData?.status === "completed" && (
          <Check className="h-4 w-4 text-green-500" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                toggleCompletionMutation.mutate({ date: formattedDate })
              }
            >
              <Check className="mr-2 h-4 w-4" />
              {dayData?.status === "completed"
                ? "Mark as Active"
                : "Mark as Completed"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleFavoriteMutation.mutate({ date: formattedDate })
              }
            >
              <Star
                className={cn(
                  "mr-2 h-4 w-4",
                  dayData?.isFavorite && "fill-yellow-500 text-yellow-500",
                )}
              />
              {dayData?.isFavorite ? "Unfavorite" : "Favorite"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCopyDialogOpen(true)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Day To...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Day</DialogTitle>
            <DialogDescription>
              Copy all logs from {format(date, "PPP")} to another date.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Select Target Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? (
                      format(targetDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCopyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={copyDayMutation.isPending || !targetDate}
            >
              {copyDayMutation.isPending ? "Copying..." : "Copy Logs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
