export type Sex = "female" | "male";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "custom";

export type BuiltInMealType = Exclude<MealType, "custom">;

export type QuantityMode = "grams" | "piece";
export type ThemeMode = "rose" | "beige";
export type MascotMode = "default" | "overeating";

export type FormulaMode = "lose" | "maintain" | "gain" | "custom";

export interface UserProfile {
  id: string;
  name: string;
  sex: Sex;
  heightCm?: number | null;
  weightKg: number;
  goalWeightKg?: number | null;
  formulaMode: FormulaMode;
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
  unitMode?: QuantityMode;
  unitLabel?: string;
  gramsPerUnit?: number | null;
  searchTerms?: string[];
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
  mealLabel?: string;
  productId: string;
  grams: number;
  quantityMode?: QuantityMode;
  servings?: number | null;
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

export interface CompanionState {
  unlockedAchievementIds: string[];
  mascotMode?: MascotMode;
  lastWeeklyRecapKey?: string | null;
  lastMessageKey?: string | null;
  lastMessageAt?: string | null;
  lastMessageText?: string | null;
  lastMessageMood?: "normal" | "celebration" | "comfort" | null;
}

export interface PersistedAppState {
  version: number;
  themeMode: ThemeMode;
  companion: CompanionState;
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
  unitMode: QuantityMode;
  unitLabel: string;
  gramsPerUnit: string;
}

export interface FormulaCoefficients {
  proteinPerKg: number;
  fatPerKg: number;
  carbsPerKg: number;
}
