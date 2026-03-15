export type Sex = "female" | "male";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface UserProfile {
  id: string;
  name: string;
  sex: Sex;
  weightKg: number;
  proteinPerKg: number;
  fatPerKg: number;
  carbsPerKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  icon?: string;
  proteinPer100: number;
  fatPer100: number;
  carbsPer100: number;
  kcalPer100: number | null;
  notes?: string;
  isCustom?: boolean;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DayEntry {
  id: string;
  userId: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealItem {
  id: string;
  dayEntryId: string;
  mealType: MealType;
  productId: string;
  grams: number;
  eatenAt?: string;
  notes?: string;
  sortOrder: number;
}

export interface NutritionTotals {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
}

export interface PersistedAppState {
  version: number;
  selectedUserId: string;
  profiles: UserProfile[];
  products: Product[];
  dayEntries: DayEntry[];
  mealItems: MealItem[];
  recentProductsByUser: Record<string, string[]>;
}

export interface DayMealRow {
  item: MealItem;
  product: Product;
  nutrition: NutritionTotals;
}

export interface DaySummary {
  entry?: DayEntry;
  items: DayMealRow[];
  totals: NutritionTotals;
  target: NutritionTotals | null;
  balance: NutritionTotals | null;
}

export interface ProductDraft {
  name: string;
  icon: string;
  proteinPer100: string;
  fatPer100: string;
  carbsPer100: string;
  kcalPer100: string;
}
