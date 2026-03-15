import { STATE_VERSION } from "@/lib/constants";
import { addDays, getTodayDate } from "@/lib/date";
import type { PersistedAppState, Product } from "@/lib/types";

const baseProducts: Product[] = [
  { id: "oatmeal", name: "Овсянка", icon: "🥣", proteinPer100: 12.3, fatPer100: 6.1, carbsPer100: 59.5, kcalPer100: 342 },
  { id: "egg", name: "Яйцо", icon: "🥚", proteinPer100: 12.7, fatPer100: 10.9, carbsPer100: 0.7, kcalPer100: 157 },
  { id: "cottage-cheese", name: "Творог 5%", icon: "🍶", proteinPer100: 17, fatPer100: 5, carbsPer100: 3, kcalPer100: 121 },
  { id: "greek-yogurt", name: "Греческий йогурт", icon: "🥛", proteinPer100: 8.5, fatPer100: 2.8, carbsPer100: 4.2, kcalPer100: 78 },
  { id: "banana", name: "Банан", icon: "🍌", proteinPer100: 1.5, fatPer100: 0.2, carbsPer100: 21.8, kcalPer100: 95 },
  { id: "apple", name: "Яблоко", icon: "🍎", proteinPer100: 0.4, fatPer100: 0.4, carbsPer100: 11.3, kcalPer100: 52 },
  { id: "berries", name: "Ягоды", icon: "🫐", proteinPer100: 1, fatPer100: 0.5, carbsPer100: 8.7, kcalPer100: 47 },
  { id: "almonds", name: "Миндаль", icon: "🌰", proteinPer100: 21.2, fatPer100: 49.9, carbsPer100: 9.1, kcalPer100: 579 },
  { id: "chicken", name: "Куриная грудка", icon: "🍗", proteinPer100: 23.6, fatPer100: 1.9, carbsPer100: 0, kcalPer100: 113 },
  { id: "turkey", name: "Индейка", icon: "🍗", proteinPer100: 21.6, fatPer100: 4.1, carbsPer100: 0, kcalPer100: 132 },
  { id: "salmon", name: "Лосось", icon: "🐟", proteinPer100: 20, fatPer100: 13, carbsPer100: 0, kcalPer100: 208 },
  { id: "tuna", name: "Тунец", icon: "🐟", proteinPer100: 24, fatPer100: 1, carbsPer100: 0, kcalPer100: 109 },
  { id: "rice", name: "Рис", icon: "🍚", proteinPer100: 7, fatPer100: 0.6, carbsPer100: 74, kcalPer100: 333 },
  { id: "buckwheat", name: "Гречка", icon: "🌾", proteinPer100: 12.6, fatPer100: 3.3, carbsPer100: 62.1, kcalPer100: 313 },
  { id: "pasta", name: "Паста", icon: "🍝", proteinPer100: 11, fatPer100: 1.3, carbsPer100: 71.5, kcalPer100: 344 },
  { id: "potato", name: "Картофель", icon: "🥔", proteinPer100: 2, fatPer100: 0.4, carbsPer100: 16.3, kcalPer100: 77 },
  { id: "avocado", name: "Авокадо", icon: "🥑", proteinPer100: 2, fatPer100: 14.7, carbsPer100: 8.5, kcalPer100: 160 },
  { id: "olive-oil", name: "Оливковое масло", icon: "🫒", proteinPer100: 0, fatPer100: 100, carbsPer100: 0, kcalPer100: 884 },
  { id: "bread", name: "Хлеб цельнозерновой", icon: "🍞", proteinPer100: 12, fatPer100: 3.5, carbsPer100: 41, kcalPer100: 247 },
  { id: "kefir", name: "Кефир", icon: "🥛", proteinPer100: 3.2, fatPer100: 2.5, carbsPer100: 4, kcalPer100: 51 },
  { id: "cucumber", name: "Огурец", icon: "🥒", proteinPer100: 0.8, fatPer100: 0.1, carbsPer100: 2.8, kcalPer100: 15 },
  { id: "tomato", name: "Помидор", icon: "🍅", proteinPer100: 1.1, fatPer100: 0.2, carbsPer100: 3.8, kcalPer100: 20 },
];

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
        weightKg: 62,
        proteinPerKg: 1.8,
        fatPerKg: 0.9,
        carbsPerKg: 2.6,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "profile-max",
        name: "Макс",
        sex: "male",
        weightKg: 84,
        proteinPerKg: 2,
        fatPerKg: 0.8,
        carbsPerKg: 3,
        createdAt: now,
        updatedAt: now,
      },
    ],
    products: baseProducts,
    dayEntries: [
      { id: `day-anna-${today}`, userId: "profile-anna", date: today, createdAt: now, updatedAt: now },
      { id: `day-anna-${yesterday}`, userId: "profile-anna", date: yesterday, createdAt: now, updatedAt: now },
    ],
    mealItems: [
      { id: "meal-1", dayEntryId: `day-anna-${today}`, mealType: "breakfast", productId: "oatmeal", grams: 60, sortOrder: 1 },
      { id: "meal-2", dayEntryId: `day-anna-${today}`, mealType: "breakfast", productId: "banana", grams: 120, sortOrder: 2 },
      { id: "meal-3", dayEntryId: `day-anna-${today}`, mealType: "breakfast", productId: "greek-yogurt", grams: 180, sortOrder: 3 },
      { id: "meal-4", dayEntryId: `day-anna-${today}`, mealType: "lunch", productId: "chicken", grams: 170, sortOrder: 1 },
      { id: "meal-5", dayEntryId: `day-anna-${today}`, mealType: "lunch", productId: "rice", grams: 80, sortOrder: 2 },
      { id: "meal-6", dayEntryId: `day-anna-${today}`, mealType: "lunch", productId: "cucumber", grams: 120, sortOrder: 3 },
      { id: "meal-7", dayEntryId: `day-anna-${today}`, mealType: "snack", productId: "almonds", grams: 20, sortOrder: 1 },
      { id: "meal-8", dayEntryId: `day-anna-${today}`, mealType: "dinner", productId: "salmon", grams: 150, sortOrder: 1 },
      { id: "meal-9", dayEntryId: `day-anna-${today}`, mealType: "dinner", productId: "potato", grams: 180, sortOrder: 2 },
      { id: "meal-10", dayEntryId: `day-anna-${yesterday}`, mealType: "breakfast", productId: "egg", grams: 120, sortOrder: 1 },
      { id: "meal-11", dayEntryId: `day-anna-${yesterday}`, mealType: "breakfast", productId: "bread", grams: 80, sortOrder: 2 },
      { id: "meal-12", dayEntryId: `day-anna-${yesterday}`, mealType: "lunch", productId: "pasta", grams: 110, sortOrder: 1 },
      { id: "meal-13", dayEntryId: `day-anna-${yesterday}`, mealType: "lunch", productId: "turkey", grams: 190, sortOrder: 2 },
      { id: "meal-14", dayEntryId: `day-anna-${yesterday}`, mealType: "snack", productId: "apple", grams: 160, sortOrder: 1 },
      { id: "meal-15", dayEntryId: `day-anna-${yesterday}`, mealType: "dinner", productId: "olive-oil", grams: 18, sortOrder: 1 },
      { id: "meal-16", dayEntryId: `day-anna-${yesterday}`, mealType: "dinner", productId: "avocado", grams: 120, sortOrder: 2 },
      { id: "meal-17", dayEntryId: `day-anna-${yesterday}`, mealType: "dinner", productId: "salmon", grams: 180, sortOrder: 3 },
    ],
    recentProductsByUser: {
      "profile-anna": ["salmon", "chicken", "oatmeal", "banana"],
      "profile-max": ["chicken", "rice", "egg"],
    },
  };
}
