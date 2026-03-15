import type { NutritionTotals, Product, UserProfile } from "@/lib/types";

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

export function getHealthyGoalFloor(heightCm?: number | null) {
  if (!heightCm || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  return Math.round(18.5 * heightM * heightM * 10) / 10;
}

export function getPlanningWeight(profile: UserProfile) {
  const goalWeight = profile.goalWeightKg && profile.goalWeightKg > 0 ? profile.goalWeightKg : profile.weightKg;
  const healthyFloor = getHealthyGoalFloor(profile.heightCm);
  const safeGoal = healthyFloor ? Math.max(goalWeight, healthyFloor) : goalWeight;

  return Math.min(profile.weightKg, safeGoal);
}

export function calculateTargets(profile: UserProfile): NutritionTotals {
  const baseWeight = getPlanningWeight(profile);
  const protein = roundMacro(baseWeight * profile.proteinPerKg);
  const fat = roundMacro(baseWeight * profile.fatPerKg);
  const carbs = roundMacro(baseWeight * profile.carbsPerKg);

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
