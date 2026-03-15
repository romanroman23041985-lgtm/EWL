import { calculateProductNutrition, calculateTargets, sumNutrition } from "@/lib/macros";
import { addDays, getTodayDate, parseDateKey } from "@/lib/date";
import { getDayEntry } from "@/lib/selectors";
import type { BuiltInMealType, PersistedAppState, UserProfile } from "@/lib/types";

export const COMFORT_RATIO = 0.12;

function sortDateKeys(dateKeys: string[]) {
  return [...new Set(dateKeys)].sort((left, right) => parseDateKey(left).getTime() - parseDateKey(right).getTime());
}

function countConsecutiveTail(dateKeys: string[], predicate: (dateKey: string) => boolean) {
  const sorted = sortDateKeys(dateKeys);
  if (!sorted.length) {
    return 0;
  }

  let streak = 0;
  let cursor = sorted[sorted.length - 1];

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const dateKey = sorted[index];
    if (dateKey !== cursor || !predicate(dateKey)) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getLoggedDateKeys(state: PersistedAppState, userId: string) {
  return sortDateKeys(
    state.dayEntries
      .filter((entry) => entry.userId === userId)
      .filter((entry) => state.mealItems.some((item) => item.dayEntryId === entry.id))
      .map((entry) => entry.date),
  );
}

export function getLatestLoggedDate(state: PersistedAppState, userId: string) {
  const dates = getLoggedDateKeys(state, userId);
  return dates[dates.length - 1] ?? null;
}

export function getLoggingStreak(state: PersistedAppState, userId: string) {
  const dates = getLoggedDateKeys(state, userId);
  return countConsecutiveTail(dates, () => true);
}

export function getMealCompletionDates(state: PersistedAppState, userId: string, mealType: BuiltInMealType) {
  const dates = state.dayEntries
    .filter((entry) => entry.userId === userId)
    .filter((entry) =>
      state.mealItems.some((item) => item.dayEntryId === entry.id && item.mealType === mealType),
    )
    .map((entry) => entry.date);

  return sortDateKeys(dates);
}

export function getMealCompletionStreak(state: PersistedAppState, userId: string, mealType: BuiltInMealType) {
  const dates = getMealCompletionDates(state, userId, mealType);
  return countConsecutiveTail(dates, () => true);
}

export function isFullLogDay(state: PersistedAppState, userId: string, dateKey: string) {
  const entry = getDayEntry(state, userId, dateKey);
  if (!entry) {
    return false;
  }

  return (["breakfast", "lunch", "dinner"] as const).every((mealType) =>
    state.mealItems.some((item) => item.dayEntryId === entry.id && item.mealType === mealType),
  );
}

export function getFullLogDates(state: PersistedAppState, userId: string) {
  return getLoggedDateKeys(state, userId).filter((dateKey) => isFullLogDay(state, userId, dateKey));
}

export function getFullLogStreak(state: PersistedAppState, userId: string) {
  const dates = getFullLogDates(state, userId);
  return countConsecutiveTail(dates, () => true);
}

export function isComfortCorridorDay(state: PersistedAppState, user: UserProfile, dateKey: string) {
  const entry = getDayEntry(state, user.id, dateKey);
  if (!entry) {
    return false;
  }

  const items = state.mealItems.filter((item) => item.dayEntryId === entry.id);
  if (!items.length) {
    return false;
  }

  const target = calculateTargets(user).kcal;
  const actual = sumNutrition(items.flatMap((item) => {
    const product = state.products.find((candidate) => candidate.id === item.productId);
    if (!product) {
      return [];
    }

    return [calculateProductNutrition(product, item.grams)];
  })).kcal;

  const low = Math.round(target * (1 - COMFORT_RATIO));
  const high = Math.round(target * (1 + COMFORT_RATIO));
  return actual >= low && actual <= high;
}

export function getComfortCorridorDates(state: PersistedAppState, user: UserProfile) {
  return getLoggedDateKeys(state, user.id).filter((dateKey) => isComfortCorridorDay(state, user, dateKey));
}

export function getComfortCorridorStreak(state: PersistedAppState, user: UserProfile) {
  const dates = getComfortCorridorDates(state, user);
  return countConsecutiveTail(dates, () => true);
}

export function isOverTargetDay(state: PersistedAppState, user: UserProfile, dateKey: string) {
  const entry = getDayEntry(state, user.id, dateKey);
  if (!entry) {
    return false;
  }

  const items = state.mealItems.filter((item) => item.dayEntryId === entry.id);
  if (!items.length) {
    return false;
  }

  const target = calculateTargets(user).kcal;
  const actual = sumNutrition(
    items.flatMap((item) => {
      const product = state.products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        return [];
      }

      return [calculateProductNutrition(product, item.grams)];
    }),
  ).kcal;

  return actual > target;
}

export function getOverTargetDates(state: PersistedAppState, user: UserProfile) {
  return getLoggedDateKeys(state, user.id).filter((dateKey) => isOverTargetDay(state, user, dateKey));
}

export function getOverTargetStreak(state: PersistedAppState, user: UserProfile) {
  const dates = getOverTargetDates(state, user);
  return countConsecutiveTail(dates, () => true);
}

export function getDaysSinceLastLog(state: PersistedAppState, userId: string) {
  const latest = getLatestLoggedDate(state, userId);
  if (!latest) {
    return null;
  }

  const diffMs = parseDateKey(getTodayDate()).getTime() - parseDateKey(latest).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getHasReturnedAfterPause(state: PersistedAppState, userId: string) {
  const dates = getLoggedDateKeys(state, userId);
  if (dates.length < 2) {
    return false;
  }

  const latest = dates[dates.length - 1];
  const previous = dates[dates.length - 2];
  const diffMs = parseDateKey(latest).getTime() - parseDateKey(previous).getTime();
  const gapDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return latest === getTodayDate() && gapDays >= 2;
}
