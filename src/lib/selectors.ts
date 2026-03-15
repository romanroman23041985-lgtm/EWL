import { mealOrder } from "@/lib/constants";
import { getVisibleProducts } from "@/lib/products";
import {
  calculateProductNutrition,
  calculateTargets,
  createEmptyNutrition,
  subtractNutrition,
  sumNutrition,
} from "@/lib/macros";
import type {
  DayMealRow,
  DaySummary,
  MealType,
  NutritionTotals,
  PersistedAppState,
  Product,
  UserProfile,
} from "@/lib/types";

export function getSelectedUser(state: PersistedAppState) {
  return state.profiles.find((profile) => profile.id === state.selectedUserId) ?? state.profiles[0] ?? null;
}

export function getUserById(state: PersistedAppState, userId: string) {
  return state.profiles.find((profile) => profile.id === userId) ?? null;
}

export function getProductMap(products: Product[]) {
  return new Map(products.map((product) => [product.id, product]));
}

export function getActiveProducts(state: PersistedAppState) {
  return getVisibleProducts(state.products);
}

export function getRecentProducts(state: PersistedAppState, userId: string) {
  const productMap = getProductMap(state.products);
  const recentIds = state.recentProductsByUser[userId] ?? [];

  return recentIds
    .map((productId) => productMap.get(productId))
    .filter((product): product is Product => Boolean(product && !product.archivedAt));
}

export function getDayEntry(state: PersistedAppState, userId: string, date: string) {
  return state.dayEntries.find((entry) => entry.userId === userId && entry.date === date);
}

export function getProductUsageCount(state: PersistedAppState, productId: string) {
  return state.mealItems.filter((item) => item.productId === productId).length;
}

export function getDaySummary(state: PersistedAppState, user: UserProfile | null, date: string): DaySummary {
  if (!user) {
    return {
      items: [],
      totals: createEmptyNutrition(),
      target: null,
      balance: null,
    };
  }

  const entry = getDayEntry(state, user.id, date);
  const productMap = getProductMap(state.products);
  const items = state.mealItems
    .filter((item) => item.dayEntryId === entry?.id)
    .sort((left, right) => {
      if (left.mealType !== right.mealType) {
        return mealOrder.indexOf(left.mealType) - mealOrder.indexOf(right.mealType);
      }

      return left.sortOrder - right.sortOrder;
    })
    .flatMap<DayMealRow>((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return [];
      }

      return [
        {
          item,
          product,
          nutrition: calculateProductNutrition(product, item.grams),
        },
      ];
    });

  const target = calculateTargets(user);
  const totals = sumNutrition(items.map((item) => item.nutrition));

  return {
    entry,
    items,
    totals,
    target,
    balance: subtractNutrition(target, totals),
  };
}

export function getItemsByMeal(summary: DaySummary) {
  return mealOrder.reduce<Record<MealType, DayMealRow[]>>(
    (acc, mealType) => {
      acc[mealType] = summary.items.filter((item) => item.item.mealType === mealType);
      return acc;
    },
    {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    },
  );
}

export function getMealTotals(rows: DayMealRow[]) {
  return sumNutrition(rows.map((row) => row.nutrition));
}

export function getMonthSummaryMap(state: PersistedAppState, user: UserProfile | null, monthDate: Date) {
  const result = new Map<
    string,
    {
      totals: NutritionTotals;
      target: NutritionTotals;
      hasItems: boolean;
      isOver: boolean;
    }
  >();

  if (!user) {
    return result;
  }

  const target = calculateTargets(user);
  const entries = state.dayEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return (
      entry.userId === user.id &&
      entryDate.getMonth() === monthDate.getMonth() &&
      entryDate.getFullYear() === monthDate.getFullYear()
    );
  });

  for (const entry of entries) {
    const rows = state.mealItems.filter((item) => item.dayEntryId === entry.id);
    const totals = sumNutrition(
      rows.flatMap((item) => {
        const product = state.products.find((candidate) => candidate.id === item.productId);
        return product ? [calculateProductNutrition(product, item.grams)] : [];
      }),
    );

    result.set(entry.date, {
      totals,
      target,
      hasItems: rows.length > 0,
      isOver: totals.kcal > target.kcal,
    });
  }

  return result;
}

export function getMonthStats(state: PersistedAppState, user: UserProfile | null, monthDate: Date) {
  const summaryMap = getMonthSummaryMap(state, user, monthDate);
  const filled = [...summaryMap.values()].filter((entry) => entry.hasItems);

  if (!filled.length) {
    return {
      average: createEmptyNutrition(),
      daysAbove: 0,
      daysWithin: 0,
      daysLogged: 0,
      totalTargetKcal: 0,
      totalActualKcal: 0,
      totalBalanceKcal: 0,
    };
  }

  const totals = sumNutrition(filled.map((entry) => entry.totals));
  const totalTargetKcal = filled.reduce((sum, entry) => sum + entry.target.kcal, 0);
  const totalActualKcal = totals.kcal;

  return {
    average: {
      protein: Math.round((totals.protein / filled.length) * 10) / 10,
      fat: Math.round((totals.fat / filled.length) * 10) / 10,
      carbs: Math.round((totals.carbs / filled.length) * 10) / 10,
      kcal: Math.round(totals.kcal / filled.length),
    },
    daysAbove: filled.filter((entry) => entry.isOver).length,
    daysWithin: filled.filter((entry) => !entry.isOver).length,
    daysLogged: filled.length,
    totalTargetKcal,
    totalActualKcal,
    totalBalanceKcal: totalTargetKcal - totalActualKcal,
  };
}
