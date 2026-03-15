import type { MealType } from "@/lib/types";

export const STORAGE_KEY = "ewl.mobile.v1";
export const STATE_VERSION = 1;

export const mealOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const mealLabels: Record<MealType, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

export const mealHints: Record<MealType, string> = {
  breakfast: "Старт дня без суеты",
  lunch: "Основной прием пищи",
  dinner: "Спокойное завершение дня",
  snack: "Быстрое добавление между делом",
};
