"use client";

import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface FoodDetailsDialogProps {
  foodCode: string | null;
  dataSource: "foundation" | "branded";
  isOpen: boolean;
  onClose: () => void;
}

export function FoodDetailsDialog({
  foodCode,
  dataSource,
  isOpen,
  onClose,
}: FoodDetailsDialogProps) {
  const { data: food, isLoading } = api.food.getById.useQuery(
    { id: foodCode!, dataSource },
    { enabled: !!foodCode && isOpen },
  );

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">
            {isLoading ? (
              <Skeleton className="h-7 w-64" />
            ) : (
              food?.product_name?.[0]?.text || "Food Details"
            )}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-40 mt-1" />
            ) : (
              <>
                {food?.brands && (
                  <span className="font-medium">{food.brands}</span>
                )}
                {food?.quantity && <span> • {food.quantity}</span>}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-full max-h-[70vh] overflow-y-auto p-6 pt-2">
            <div className="space-y-6">
              {/* Badges skeleton */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              {/* Categories skeleton */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>

              <Separator />

              {/* Nutritional info skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-32" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div className="flex justify-between border-b py-1" key={i}>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Ingredients skeleton */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        ) : food ? (
          <div className="h-full max-h-[70vh] overflow-y-auto p-6 pt-2">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{food.source || "Database"}</Badge>
                {food.nutriscore_grade && (
                  <Badge
                    className={cn(
                      "uppercase",
                      food.nutriscore_grade === "a"
                        ? "bg-green-500"
                        : food.nutriscore_grade === "b"
                          ? "bg-lime-500"
                          : food.nutriscore_grade === "c"
                            ? "bg-yellow-500"
                            : food.nutriscore_grade === "d"
                              ? "bg-orange-500"
                              : "bg-red-500",
                    )}
                  >
                    Nutri-Score {food.nutriscore_grade}
                  </Badge>
                )}
                {food.nova_group && (
                  <Badge variant="secondary">NOVA {food.nova_group}</Badge>
                )}
              </div>

              {food.categories && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Categories</h4>
                  <p className="text-muted-foreground text-sm">
                    {food.categories}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-bold text-lg">Nutritional Information</h4>
                <p className="text-muted-foreground text-xs italic">
                  Values per 100g/100ml
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {(Array.isArray(food.nutriments)
                    ? food.nutriments
                    : (food.nutriments as any)?.items || []
                  )?.map((n: any, i: number) => {
                    // DuckDB result might have entries wrapper
                    const data = n.entries ?? n;
                    const value = data["100g"] ?? data.value;
                    if (value === null || value === undefined) return null;

                    return (
                      <div
                        className="flex justify-between border-b py-1 text-sm"
                        key={i}
                      >
                        <span className="capitalize">
                          {data.name?.replace(/-/g, " ")}
                        </span>
                        <span className="font-medium">
                          {typeof value === "number" ? value.toFixed(1) : value}{" "}
                          {data.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {food.ingredients_text && food.ingredients_text.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Ingredients</h4>
                    <p className="text-muted-foreground text-sm">
                      {food.ingredients_text[0]?.text}
                    </p>
                  </div>
                </>
              )}

              {food.allergens_tags && food.allergens_tags.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Allergens</h4>
                  <div className="flex flex-wrap gap-1">
                    {food.allergens_tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="destructive"
                        className="bg-red-100 text-red-700 hover:bg-red-100 border-none capitalize"
                      >
                        {tag.replace("en:", "")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-60 items-center justify-center text-muted-foreground">
            Food not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
