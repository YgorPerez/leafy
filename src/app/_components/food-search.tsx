"use client";

import { format } from "date-fns";
import { Check, Info, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { type FoodSearchResult } from "~/server/api/routers/food.schema";
import { api } from "~/trpc/react";
import { ContextPlate, type PlateItem } from "./context-plate";
import { FoodDetailsDialog } from "./food-details-dialog";

type DataSource = "foundation" | "branded";

export function FoodSearch({ date }: { date: Date }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dataSource, setDataSource] = useState<DataSource>("branded");

  const utils = api.useUtils();
  const logMutation = api.food.logFoods.useMutation({
    onSuccess: () => {
      void utils.food.getDailyLogs.invalidate();
      void utils.food.getDailyNutrition.invalidate();
    },
  });

  const { data: foods, isLoading } = api.food.search.useQuery(
    { query: debouncedQuery, dataSource },
    { enabled: debouncedQuery.length > 2 },
  );

  const [plateItems, setPlateItems] = useState<PlateItem[]>([]);
  const [isPlateOpen, setIsPlateOpen] = useState(false);
  const [viewingFoodCode, setViewingFoodCode] = useState<string | null>(null);
  const [viewingDataSource, setViewingDataSource] =
    useState<DataSource>("branded");

  const toggleSelection = (food: FoodSearchResult) => {
    setPlateItems((prev) => {
      const exists = prev.find((item) => item.food.code === food.code);
      if (exists) {
        return prev.filter((item) => item.food.code !== food.code);
      }
      setIsPlateOpen(true);
      return [...prev, { food: food, quantity: 100, unit: "g" }];
    });
  };

  const isSelected = (code: string) =>
    plateItems.some((i) => i.food.code === code);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="relative mx-auto max-w-2xl space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
          <Input
            className="h-14 rounded-full border-2 bg-background/50 pr-32 pl-12 text-lg shadow-lg backdrop-blur-sm focus-visible:ring-primary/20"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setDebouncedQuery(query);
              }
            }}
            placeholder={
              dataSource === "foundation"
                ? "Search for real foods (apple, chicken, rice...)"
                : "Search for branded products..."
            }
            type="text"
            value={query}
          />
          <Button
            className="absolute right-2 h-10 rounded-full px-6 font-bold"
            onClick={() => setDebouncedQuery(query)}
          >
            Search
          </Button>
        </div>

        {/* Data Source Toggle */}
        <div className="flex justify-center gap-2">
          <Button
            variant={dataSource === "foundation" ? "default" : "outline"}
            className={cn(
              "rounded-full px-4",
              dataSource === "foundation" && "bg-green-500 hover:bg-green-600",
            )}
            onClick={() => {
              setDataSource("foundation");
              setDebouncedQuery("");
              setQuery("");
            }}
          >
            🥬 Real Foods
          </Button>
          <Button
            variant={dataSource === "branded" ? "default" : "outline"}
            className={cn(
              "rounded-full px-4",
              dataSource === "branded" && "bg-blue-500 hover:bg-blue-600",
            )}
            onClick={() => {
              setDataSource("branded");
              setDebouncedQuery("");
              setQuery("");
            }}
          >
            🏷️ Branded
          </Button>
        </div>
      </div>

      <div className="min-h-[100px]">
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <div className="pr-8">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {foods && foods.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {foods.map((food) => {
              const selected = isSelected(food.code || "");
              return (
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary/50",
                  )}
                  key={food.code}
                  onClick={() => toggleSelection(food)}
                >
                  <CardContent className="relative p-5">
                    <div className="absolute top-4 right-4">
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {selected && <Check className="h-4 w-4" />}
                      </div>
                    </div>

                    <div className="pr-8">
                      <h3 className="line-clamp-2 font-semibold text-lg leading-tight">
                        {food.product_name || "Unknown Product"}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-muted-foreground text-sm">
                        {food.brands || "No brand"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="text-xs" variant="secondary">
                          {food.source || "Database"}
                        </Badge>
                        {food.nutriscore_grade && (
                          <Badge
                            className={cn(
                              "text-xs uppercase",
                              food.nutriscore_grade === "a"
                                ? "bg-green-500 hover:bg-green-600"
                                : food.nutriscore_grade === "b"
                                  ? "bg-lime-500 hover:bg-lime-600"
                                  : food.nutriscore_grade === "c"
                                    ? "bg-yellow-500 hover:bg-yellow-600"
                                    : food.nutriscore_grade === "d"
                                      ? "bg-orange-500 hover:bg-orange-600"
                                      : "bg-red-500 hover:bg-red-600",
                            )}
                          >
                            Score {food.nutriscore_grade}
                          </Badge>
                        )}
                      </div>

                      <Button
                        className="mt-4 h-8 w-full justify-start px-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingFoodCode(food.code || null);
                          setViewingDataSource(dataSource);
                        }}
                        variant="ghost"
                      >
                        <Info className="mr-2 h-4 w-4" />
                        View details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {foods && foods.length === 0 && debouncedQuery && !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 text-center text-muted-foreground">
            <p className="font-medium text-xl">
              No results found for "{debouncedQuery}"
            </p>
            <p className="mt-2">Try searching for something else</p>
          </div>
        )}
      </div>

      <ContextPlate
        isLogging={logMutation.isPending}
        isOpen={isPlateOpen && plateItems.length > 0}
        items={plateItems}
        onClose={() => setIsPlateOpen(false)}
        onLog={async () => {
          const formattedDate = format(date, "yyyy-MM-dd");
          try {
            await logMutation.mutateAsync(
              plateItems.map((item) => ({
                date: formattedDate,
                foodCode: item.food.code!,
                foodName: item.food.product_name || "Unknown",
                foodBrand: item.food.brands,
                source: item.food.source as any,
                quantity: item.quantity,
                unit: item.unit,
              })),
            );
            toast.success("Logged successfully!");
            setPlateItems([]);
            setIsPlateOpen(false);
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            toast.error("Failed to log items: " + message);
          }
        }}
        onRemove={(idx) => setPlateItems((p) => p.filter((_, i) => i !== idx))}
        onUpdate={(idx, update) =>
          setPlateItems((p) =>
            p.map((item, i) => (i === idx ? { ...item, ...update } : item)),
          )
        }
      />
      <FoodDetailsDialog
        foodCode={viewingFoodCode}
        dataSource={viewingDataSource}
        isOpen={!!viewingFoodCode}
        onClose={() => setViewingFoodCode(null)}
      />
    </div>
  );
}
