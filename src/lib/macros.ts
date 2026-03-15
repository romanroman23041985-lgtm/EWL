import type { Product, UserProfile, NutritionTotals } from "@/lib/types";

export function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

export function roundKcal(value: number) {
  return Math.round(value);
}

export function createEmptyNutrition(): NutritionTotals {
  return {
    protein: 0,
    fat: 0,
    carbs: 0,
    kcal: 0,
  };
}

export function resolveProductKcal(product: Product) {
  if (typeof product.kcalPer100 === "number" && product.kcalPer100 > 0) {
    return product.kcalPer100;
  }

  return roundKcal(product.proteinPer100 * 4 + product.fatPer100 * 9 + product.carbsPer100 * 4);
}

export function calculateTargets(profile: UserProfile): NutritionTotals {
  const protein = roundMacro(profile.weightKg * profile.proteinPerKg);
  const fat = roundMacro(profile.weightKg * profile.fatPerKg);
  const carbs = roundMacro(profile.weightKg * profile.carbsPerKg);

  return {
    protein,
    fat,
    carbs,
    kcal: roundKcal(protein * 4 + fat * 9 + carbs * 4),
  };
}

export function calculateProductNutrition(product: Product, grams: number): NutritionTotals {
  const ratio = grams / 100;
  return {
    protein: roundMacro(product.proteinPer100 * ratio),
    fat: roundMacro(product.fatPer100 * ratio),
    carbs: roundMacro(product.carbsPer100 * ratio),
    kcal: roundKcal(resolveProductKcal(product) * ratio),
  };
}

export function sumNutrition(values: NutritionTotals[]) {
  return values.reduce<NutritionTotals>(
    (acc, item) => ({
      protein: roundMacro(acc.protein + item.protein),
      fat: roundMacro(acc.fat + item.fat),
      carbs: roundMacro(acc.carbs + item.carbs),
      kcal: roundKcal(acc.kcal + item.kcal),
    }),
    createEmptyNutrition(),
  );
}

export function subtractNutrition(target: NutritionTotals, actual: NutritionTotals): NutritionTotals {
  return {
    protein: roundMacro(target.protein - actual.protein),
    fat: roundMacro(target.fat - actual.fat),
    carbs: roundMacro(target.carbs - actual.carbs),
    kcal: roundKcal(target.kcal - actual.kcal),
  };
}
