"use client";

import { useState } from "react";
import { format } from "date-fns";
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
  dataSource: "foundation" | "branded";
};

interface ContextPlateProps {
  items: PlateItem[];
  onUpdate: (index: number, updates: Partial<PlateItem>) => void;
  onRemove: (index: number) => void;
  onLog: (time: string) => void;
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
  const [time, setTime] = useState(format(new Date(), "HH:mm"));

  if (!isOpen || items.length === 0) return null;

  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-50 flex flex-col border-t px-6 py-6 shadow-2xl backdrop-blur-xl sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold shadow-lg">
              {items.length}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Your Plate</h2>
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

        {/* Time Selection */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-medium">Log Time:</span>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-32"
          />
        </div>

        <div className="max-h-[30vh] space-y-3 overflow-y-auto pr-2">
          {items.map((item, idx) => (
            <div
              className="bg-card hover:bg-accent/50 flex items-center justify-between rounded-xl border p-4 shadow-sm transition-colors"
              key={`${item.food.code}-${idx}`}
            >
              <div className="flex items-center gap-4">
                <Button
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
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
            className="w-full py-6 text-lg font-bold shadow-lg"
            disabled={isLogging}
            onClick={() => {
              onLog(time); // Pass HH:mm string
            }}
          >
            {isLogging ? "Logging..." : "Log All Items"}
          </Button>
        </div>
      </div>
    </div>
  );
}
