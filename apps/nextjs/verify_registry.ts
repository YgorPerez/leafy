import { type DRIMetrics } from "./src/lib/clinical-calculator";
import {
  getClinicalValue,
  normalizeToCanonicalKey,
} from "./src/lib/nutrients/registry";

async function test() {
  console.log("--- Testing Nutrient Normalization ---");
  const tests = [
    { input: "Energy", expected: "energy" },
    { input: "Energy-kcal", expected: "energy" },
    { input: "energy_kCal", expected: "energy" },
    { input: "Protein", expected: "protein" },
    { input: "Sugar alcohols", expected: "alcohol" },
    { input: "Fiber, soluble", expected: "fiber_soluble" },
    { input: "UnknownNutrient", expected: null },
  ];

  for (const t of tests) {
    const result = normalizeToCanonicalKey(t.input);
    console.log(
      `Input: ${t.input} -> Result: ${result} (Expected: ${t.expected})`,
    );
    if (result !== t.expected)
      throw new Error(`Failed normalization for ${t.input}`);
  }

  console.log("\n--- Testing Clinical Value Lookup ---");
  const mockMetrics = {
    nutrients: {
      carbohydrate: {
        total: { recommended: 300 },
        fiber: { total: { recommended: 38 }, soluble: { recommended: 5 } },
        sugar: { total: { recommended: 50 }, added: { recommended: 25 } },
      },
      protein: { total: { recommended: 150 } },
      fat: { total: { recommended: 100 } },
    },
  } as unknown as DRIMetrics;

  const clinicalTests = [
    { key: "carbohydrate", expected: 300 },
    { key: "fiber", expected: 38 },
    { key: "fiber_soluble", expected: 5 },
    { key: "sugar_added", expected: 25 },
    { key: "protein", expected: 150 },
  ];

  for (const t of clinicalTests) {
    const result = getClinicalValue(mockMetrics, t.key as any);
    console.log(`Key: ${t.key} -> Value: ${result} (Expected: ${t.expected})`);
    if (result !== t.expected)
      throw new Error(`Failed clinical lookup for ${t.key}`);
  }

  console.log("\n✅ Registry verification logic passed!");
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
