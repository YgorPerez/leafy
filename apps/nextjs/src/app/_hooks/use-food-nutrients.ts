"use client";

import { useMemo } from "react";

import type { CanonicalNutrientKey, FoodProduct } from "@acme/api/client";
import { convertNutrientValue, NUTRIENT_REGISTRY } from "@acme/api/client";

export const MACRO_COLORS = {
  protein: "#ef4444", // red-500
  carbs: "#eab308", // yellow-500
  fat: "#22c55e", // green-500
};

export function useFoodNutrients(
  food: FoodProduct | undefined,
  servingSize: number,
) {
  const scalingFactor = servingSize / 100;

  const nutrients = useMemo(() => {
    if (!food?.nutriments) return [];

    return food.nutriments
      .map((n) => {
        const rawValue = n["100g"] ?? n.value ?? 0;
        const potentialKey = n.name as string;
        const key =
          potentialKey in NUTRIENT_REGISTRY
            ? (potentialKey as CanonicalNutrientKey)
            : undefined;

        const metadata = key ? NUTRIENT_REGISTRY[key] : null;

        const targetUnit = metadata?.unit || n.unit || "g";
        const scaledValue = Number(rawValue) * scalingFactor;

        // Convert to target unit if they differ
        const convertedValue = convertNutrientValue(
          scaledValue,
          n.unit || "g",
          targetUnit,
        );

        return {
          key,
          name: metadata?.label || n.name || "Unknown",
          value: convertedValue ?? scaledValue,
          unit: targetUnit,
          baseValue: rawValue,
        };
      })
      .filter(
        (n) =>
          n.baseValue !== null &&
          n.baseValue !== undefined &&
          n.baseValue !== 0,
      );
  }, [food, scalingFactor]);

  const macroData = useMemo(() => {
    const findValue = (key: CanonicalNutrientKey) =>
      nutrients.find((n) => n.key === key)?.value || 0;

    const protein = findValue("protein");
    const carbs = findValue("carbohydrate");
    const fat = findValue("fat");

    if (protein === 0 && carbs === 0 && fat === 0) return [];

    return [
      { name: "Protein", value: protein, color: MACRO_COLORS.protein },
      { name: "Carbs", value: carbs, color: MACRO_COLORS.carbs },
      { name: "Fat", value: fat, color: MACRO_COLORS.fat },
    ].filter((d) => d.value > 0);
  }, [nutrients]);

  const calories = useMemo(() => {
    return nutrients.find((n) => n.key === "energy")?.value || 0;
  }, [nutrients]);

  return {
    nutrients,
    macroData,
    calories,
    scalingFactor,
  };
}
