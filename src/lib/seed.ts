import { buildBaseProducts } from "@/lib/base-products";
import { STATE_VERSION } from "@/lib/constants";
import { addDays, getTodayDate } from "@/lib/date";
import type { PersistedAppState } from "@/lib/types";

export function buildSeedState(): PersistedAppState {
  const today = getTodayDate();
  const yesterday = addDays(today, -1);
  const now = new Date().toISOString();

  return {
    version: STATE_VERSION,
    selectedUserId: "profile-anna",
    profiles: [
      {
        id: "profile-anna",
        name: "Анна",
        sex: "female",
        heightCm: 168,
        weightKg: 62,
        goalWeightKg: 58,
        proteinPerKg: 2,
        fatPerKg: 1.5,
        carbsPerKg: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "profile-max",
        name: "Макс",
        sex: "male",
        heightCm: 182,
        weightKg: 84,
        goalWeightKg: 78,
        proteinPerKg: 2,
        fatPerKg: 1.5,
        carbsPerKg: 3,
        createdAt: now,
        updatedAt: now,
      },
    ],
    products: buildBaseProducts(),
    dayEntries: [
      { id: `day-anna-${today}`, userId: "profile-anna", date: today, createdAt: now, updatedAt: now },
      { id: `day-anna-${yesterday}`, userId: "profile-anna", date: yesterday, createdAt: now, updatedAt: now },
    ],
    mealItems: [
      { id: "meal-1", dayEntryId: `day-anna-${today}`, mealType: "breakfast", productId: "oatmeal", grams: 60, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-2", dayEntryId: `day-anna-${today}`, mealType: "breakfast", productId: "banana", grams: 120, quantityMode: "grams", servings: null, sortOrder: 2 },
      { id: "meal-3", dayEntryId: `day-anna-${today}`, mealType: "breakfast", productId: "greek-yogurt", grams: 180, quantityMode: "grams", servings: null, sortOrder: 3 },
      { id: "meal-4", dayEntryId: `day-anna-${today}`, mealType: "lunch", productId: "chicken", grams: 170, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-5", dayEntryId: `day-anna-${today}`, mealType: "lunch", productId: "rice", grams: 80, quantityMode: "grams", servings: null, sortOrder: 2 },
      { id: "meal-6", dayEntryId: `day-anna-${today}`, mealType: "lunch", productId: "cucumber", grams: 120, quantityMode: "grams", servings: null, sortOrder: 3 },
      { id: "meal-7", dayEntryId: `day-anna-${today}`, mealType: "snack", productId: "almonds", grams: 20, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-8", dayEntryId: `day-anna-${today}`, mealType: "dinner", productId: "salmon", grams: 150, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-9", dayEntryId: `day-anna-${today}`, mealType: "dinner", productId: "potato", grams: 180, quantityMode: "grams", servings: null, sortOrder: 2 },
      { id: "meal-10", dayEntryId: `day-anna-${yesterday}`, mealType: "breakfast", productId: "egg", grams: 120, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-11", dayEntryId: `day-anna-${yesterday}`, mealType: "breakfast", productId: "bread", grams: 80, quantityMode: "grams", servings: null, sortOrder: 2 },
      { id: "meal-12", dayEntryId: `day-anna-${yesterday}`, mealType: "lunch", productId: "pasta", grams: 110, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-13", dayEntryId: `day-anna-${yesterday}`, mealType: "lunch", productId: "turkey", grams: 190, quantityMode: "grams", servings: null, sortOrder: 2 },
      { id: "meal-14", dayEntryId: `day-anna-${yesterday}`, mealType: "snack", productId: "apple", grams: 160, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-15", dayEntryId: `day-anna-${yesterday}`, mealType: "dinner", productId: "olive-oil", grams: 18, quantityMode: "grams", servings: null, sortOrder: 1 },
      { id: "meal-16", dayEntryId: `day-anna-${yesterday}`, mealType: "dinner", productId: "avocado", grams: 120, quantityMode: "grams", servings: null, sortOrder: 2 },
      { id: "meal-17", dayEntryId: `day-anna-${yesterday}`, mealType: "dinner", productId: "salmon", grams: 180, quantityMode: "grams", servings: null, sortOrder: 3 },
    ],
    recentProductsByUser: {
      "profile-anna": ["salmon", "chicken", "oatmeal", "banana"],
      "profile-max": ["chicken", "rice", "egg"],
    },
  };
}
