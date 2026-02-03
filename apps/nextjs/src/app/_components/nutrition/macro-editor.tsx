"use client";

import { useEffect, useState } from "react";

import type { DRIMetrics } from "@acme/api/client";
import { getClinicalValue } from "@acme/api/client";

import type { Goal } from "~/app/_hooks/use-nutrition-goals";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

interface MacroEditorProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: DRIMetrics;
  goals: Record<string, Goal>;
  onApply: (ratios: {
    energy: number;
    carbs: number;
    protein: number;
    fat: number;
  }) => void;
}

export function MacroEditor({
  isOpen,
  onClose,
  metrics,
  goals,
  onApply,
}: MacroEditorProps) {
  const [state, setState] = useState({
    energy: 2000,
    carbs: { g: 0, pct: 50 },
    protein: { g: 0, pct: 20 },
    fat: { g: 0, pct: 30 },
  });

  useEffect(() => {
    if (isOpen) {
      const currentEnergy = goals["energy"]?.target ?? metrics.tee;
      const c =
        goals["carbohydrate"]?.target ??
        getClinicalValue(metrics, "carbohydrate") ??
        0;
      const p =
        goals["protein"]?.target ?? getClinicalValue(metrics, "protein") ?? 0;
      const f = goals["fat"]?.target ?? getClinicalValue(metrics, "fat") ?? 0;

      setState({
        energy: currentEnergy,
        carbs: { g: c, pct: Math.round(((c * 4) / currentEnergy) * 100) },
        protein: { g: p, pct: Math.round(((p * 4) / currentEnergy) * 100) },
        fat: { g: f, pct: Math.round(((f * 9) / currentEnergy) * 100) },
      });
    }
  }, [isOpen, goals, metrics]);

  const syncMacros = (
    base: "g" | "pct" | "energy",
    values: typeof state,
    changedField?: "carbs" | "protein" | "fat",
  ) => {
    const next = { ...values };
    const { energy } = next;

    if (base === "energy" || base === "pct") {
      if (base === "pct" && changedField) {
        const keys = ["carbs", "protein", "fat"] as const;
        type MacroField = (typeof keys)[number];
        const others = keys.filter((k) => k !== changedField);
        const changedVal = next[changedField as MacroField].pct;
        const remaining = 100 - changedVal;

        // Adjust others proportionally
        const currentOthersTotal =
          state[others[0] as MacroField].pct +
          state[others[1] as MacroField].pct;
        if (currentOthersTotal > 0) {
          next[others[0] as MacroField].pct = Math.round(
            (state[others[0] as MacroField].pct / currentOthersTotal) *
              remaining,
          );
        } else {
          next[others[0] as MacroField].pct = Math.floor(remaining / 2);
        }
        next[others[1] as MacroField].pct =
          100 - changedVal - next[others[0] as MacroField].pct;
      }

      next.carbs.g = Math.round((energy * (next.carbs.pct / 100)) / 4);
      next.protein.g = Math.round((energy * (next.protein.pct / 100)) / 4);
      next.fat.g = Math.round((energy * (next.fat.pct / 100)) / 9);
    } else if (base === "g") {
      next.carbs.pct = Math.round(((next.carbs.g * 4) / energy) * 100);
      next.protein.pct = Math.round(((next.protein.g * 4) / energy) * 100);
      next.fat.pct = Math.round(((next.fat.g * 9) / energy) * 100);
    }

    return next;
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="border-white/10 bg-[#0c0c0c] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Adjust Macro Ratios
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              Total Energy Goal
            </Label>
            <div className="flex items-center gap-3">
              <Input
                className="h-12 border-white/10 bg-white/5 font-mono text-xl"
                onChange={(e) =>
                  setState((s) =>
                    syncMacros("energy", {
                      ...s,
                      energy: Number(e.target.value),
                    }),
                  )
                }
                type="number"
                value={state.energy}
              />
              <span className="text-muted-foreground font-bold">kcal</span>
            </div>
          </div>

          <Separator className="bg-white/5" />

          <div className="space-y-4">
            {/* Carbs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-yellow-500/80 uppercase">
                  Carbohydrates (%)
                </Label>
                <Input
                  className="border-yellow-500/20 bg-yellow-500/5"
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    setState((s) =>
                      syncMacros(
                        "pct",
                        { ...s, carbs: { ...s.carbs, pct } },
                        "carbs",
                      ),
                    );
                  }}
                  type="number"
                  value={state.carbs.pct}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase">
                  Grams (g)
                </Label>
                <Input
                  className="border-white/10 bg-white/5"
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setState((s) =>
                      syncMacros("g", { ...s, carbs: { ...s.carbs, g } }),
                    );
                  }}
                  type="number"
                  value={state.carbs.g}
                />
              </div>
            </div>

            {/* Protein */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-red-500/80 uppercase">
                  Protein (%)
                </Label>
                <Input
                  className="border-red-500/20 bg-red-500/5"
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    setState((s) =>
                      syncMacros(
                        "pct",
                        { ...s, protein: { ...s.protein, pct } },
                        "protein",
                      ),
                    );
                  }}
                  type="number"
                  value={state.protein.pct}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase">
                  Grams (g)
                </Label>
                <Input
                  className="border-white/10 bg-white/5"
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setState((s) =>
                      syncMacros("g", { ...s, protein: { ...s.protein, g } }),
                    );
                  }}
                  type="number"
                  value={state.protein.g}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-emerald-500/80 uppercase">
                  Fat (%)
                </Label>
                <Input
                  className="border-emerald-500/20 bg-emerald-500/5"
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    setState((s) =>
                      syncMacros(
                        "pct",
                        { ...s, fat: { ...s.fat, pct } },
                        "fat",
                      ),
                    );
                  }}
                  type="number"
                  value={state.fat.pct}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase">
                  Grams (g)
                </Label>
                <Input
                  className="border-white/10 bg-white/5"
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setState((s) =>
                      syncMacros("g", { ...s, fat: { ...s.fat, g } }),
                    );
                  }}
                  type="number"
                  value={state.fat.g}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              className="group bg-primary text-primary-foreground relative w-full overflow-hidden py-6 text-lg font-bold transition-all hover:scale-[1.02]"
              onClick={() =>
                onApply({
                  energy: state.energy,
                  carbs: state.carbs.g,
                  protein: state.protein.g,
                  fat: state.fat.g,
                })
              }
            >
              <div className="relative z-10">Apply Ratios</div>
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
