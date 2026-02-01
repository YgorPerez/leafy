"use client";

import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export type PlateItem = {
  food: {
    code: string | null;
    product_name: string | null;
    brands: string | null;
    source?: string;
  };
  quantity: number;
  unit: string;
};

interface ContextPlateProps {
  items: PlateItem[];
  onUpdate: (index: number, updates: Partial<PlateItem>) => void;
  onRemove: (index: number) => void;
  onLog: () => void;
  isOpen: boolean;
  onClose: () => void;
  isLogging?: boolean;
}

export function ContextPlate({
  items,
  onUpdate,
  onRemove,
  onLog,
  isOpen,
  onClose,
  isLogging,
}: ContextPlateProps) {
  if (!isOpen || items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col border-t bg-background/95 px-6 py-6 shadow-2xl backdrop-blur-xl sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground shadow-lg">
              {items.length}
            </div>
            <h2 className="font-bold text-2xl tracking-tight">Your Plate</h2>
          </div>
          <Button
            className="rounded-full"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-2">
          {items.map((item, idx) => (
            <div
              className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
              key={`${item.food.code}-${idx}`}
            >
              <div className="flex items-center gap-4">
                <Button
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(idx)}
                  size="icon"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div>
                  <div className="font-semibold">{item.food.product_name}</div>
                  <div className="text-muted-foreground text-sm">
                    {item.food.brands}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  className="w-20 text-center"
                  onChange={(e) =>
                    onUpdate(idx, { quantity: Number(e.target.value) })
                  }
                  type="number"
                  value={item.quantity}
                />
                <Select
                  onValueChange={(val) => onUpdate(idx, { unit: val })}
                  value={item.unit}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="serving">serving</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <Button
            className="w-full py-6 font-bold text-lg shadow-lg"
            disabled={isLogging}
            onClick={onLog}
          >
            {isLogging ? "Logging..." : "Log All Items"}
          </Button>
        </div>
      </div>
    </div>
  );
}
