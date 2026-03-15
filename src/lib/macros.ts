import { FORMULA_PRESETS } from "@/lib/constants";
import type { FormulaCoefficients, FormulaMode, NutritionTotals, Product, UserProfile } from "@/lib/types";

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

export function normalizeFormulaMode(mode?: string | null): FormulaMode {
  if (mode === "lose" || mode === "maintain" || mode === "gain" || mode === "custom") {
    return mode;
  }

  if (mode === "standard") {
    return "maintain";
  }

  return "maintain";
}

export function getPlanningWeight(profile: UserProfile) {
  const goalWeight = profile.goalWeightKg && profile.goalWeightKg > 0 ? profile.goalWeightKg : profile.weightKg;
  const healthyFloor = getHealthyGoalFloor(profile.heightCm);
  const safeGoal = healthyFloor ? Math.max(goalWeight, healthyFloor) : goalWeight;

  return Math.min(profile.weightKg, safeGoal);
}

export function getFormulaBaseWeight(profile: UserProfile) {
  const mode = normalizeFormulaMode(profile.formulaMode);
  const goalWeight = profile.goalWeightKg && profile.goalWeightKg > 0 ? profile.goalWeightKg : profile.weightKg;

  if (mode === "lose") {
    return getPlanningWeight(profile);
  }

  if (mode === "gain") {
    return Math.max(profile.weightKg, goalWeight);
  }

  return profile.weightKg;
}

export function resolveProfileFormula(
  profile: Pick<UserProfile, "formulaMode" | "proteinPerKg" | "fatPerKg" | "carbsPerKg">,
): FormulaCoefficients {
  const mode = normalizeFormulaMode(profile.formulaMode);

  if (mode !== "custom") {
    return FORMULA_PRESETS[mode];
  }

  return {
    proteinPerKg: profile.proteinPerKg,
    fatPerKg: profile.fatPerKg,
    carbsPerKg: profile.carbsPerKg,
  };
}

export function calculateTargets(profile: UserProfile): NutritionTotals {
  const baseWeight = getFormulaBaseWeight(profile);
  const coefficients = resolveProfileFormula(profile);
  const protein = roundMacro(baseWeight * coefficients.proteinPerKg);
  const fat = roundMacro(baseWeight * coefficients.fatPerKg);
  const carbs = roundMacro(baseWeight * coefficients.carbsPerKg);

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
