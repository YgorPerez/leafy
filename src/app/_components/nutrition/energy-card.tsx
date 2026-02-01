"use client";

import { Edit2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

interface EnergyCardProps {
  intake: number;
  target: number;
  onEdit: () => void;
}

export function EnergyCard({ intake, target, onEdit }: EnergyCardProps) {
  const progress = (intake / target) * 100;

  return (
    <Card className="group relative overflow-hidden border border-white/5 bg-white/[0.02] shadow-sm backdrop-blur-md md:col-span-2">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 transition-all duration-500 group-hover:opacity-100" />
      <div className="absolute top-3 right-3 z-20">
        <Button
          className="h-8 w-8 text-muted-foreground opacity-0 transition-all hover:bg-white/10 group-hover:opacity-100"
          onClick={onEdit}
          size="icon"
          variant="ghost"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="relative z-10 flex items-center justify-between p-8">
        <div className="flex flex-col items-start gap-1">
          <span className="font-bold text-muted-foreground/60 text-xs uppercase tracking-[0.2em]">
            Energy Expenditure
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-5xl text-white tracking-tighter">
              {intake.toFixed(0)}
            </span>
            <span className="font-medium text-muted-foreground/40 text-xl">
              / {target} kcal
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="relative flex items-center justify-center">
            <svg className="h-16 w-16 -rotate-90 transform">
              <circle
                className="text-white/5"
                cx="32"
                cy="32"
                fill="transparent"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
              />
              <circle
                className="text-primary transition-all duration-1000 ease-out"
                cx="32"
                cy="32"
                fill="transparent"
                r="28"
                stroke="currentColor"
                strokeDasharray={175.92}
                strokeDashoffset={175.92 * (1 - Math.min(progress / 100, 1))}
                strokeWidth="4"
              />
            </svg>
            <span className="absolute font-bold text-sm">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </CardContent>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/[0.02]">
        <div
          className="h-full bg-gradient-to-r from-primary/40 to-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-1000 ease-in-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </Card>
  );
}
