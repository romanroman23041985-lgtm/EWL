import {
  getComfortCorridorStreak,
  getFullLogStreak,
  getHasReturnedAfterPause,
  getLoggingStreak,
  getMealCompletionStreak,
} from "@/lib/companion/streaks";
import type { BuiltInMealType, PersistedAppState, UserProfile } from "@/lib/types";

export type CompanionAchievement = {
  id: string;
  title: string;
  subtitle: string;
  celebration: string;
};

type AchievementRule = CompanionAchievement & {
  isUnlocked: (state: PersistedAppState, user: UserProfile) => boolean;
};

function loggingRule(days: number): AchievementRule {
  return {
    id: `logging-${days}`,
    title: `${days} дней подряд`,
    subtitle: days >= 14 ? "Уааа, я уже почти подпрыгнул ложечкой." : "Ля-ля, я считаю денечки и радуюсь.",
    celebration: "sparkle",
    isUnlocked: (state, user) => getLoggingStreak(state, user.id) >= days,
  };
}

function mealRule(mealType: BuiltInMealType, days: number, title: string): AchievementRule {
  return {
    id: `${mealType}-${days}`,
    title,
    subtitle: "Ой, этот прием пищи так аккуратно закрывается, хи-хи.",
    celebration: "wiggle",
    isUnlocked: (state, user) => getMealCompletionStreak(state, user.id, mealType) >= days,
  };
}

function fullLogRule(days: number): AchievementRule {
  return {
    id: `full-log-${days}`,
    title: `${days} дней с полным логом`,
    subtitle: "Я прям сижу и тихонько сияю от такой красоты.",
    celebration: "sparkle",
    isUnlocked: (state, user) => getFullLogStreak(state, user.id) >= days,
  };
}

function corridorRule(days: number): AchievementRule {
  return {
    id: `corridor-${days}`,
    title: `${days} дня в комфортном коридоре`,
    subtitle: "Ой как ровненько, я аж ложечкой дзынь.",
    celebration: "glow",
    isUnlocked: (state, user) => getComfortCorridorStreak(state, user) >= days,
  };
}

export const achievementRules: AchievementRule[] = [
  loggingRule(3),
  loggingRule(5),
  loggingRule(7),
  loggingRule(10),
  loggingRule(14),
  loggingRule(30),
  mealRule("breakfast", 3, "3 завтрака подряд"),
  mealRule("lunch", 3, "3 обеда подряд"),
  mealRule("dinner", 3, "3 ужина подряд"),
  fullLogRule(5),
  fullLogRule(7),
  corridorRule(3),
  corridorRule(5),
  {
    id: "return-after-pause",
    title: "Возвращение после паузы",
    subtitle: "Уааа, ты вернулся, а я тут тихонько радовался заранее.",
    celebration: "pop",
    isUnlocked: (state, user) => getHasReturnedAfterPause(state, user.id),
  },
];

export function getUnlockedAchievements(
  state: PersistedAppState,
  user: UserProfile | null,
  alreadyUnlockedIds: string[],
) {
  if (!user) {
    return [] as CompanionAchievement[];
  }

  const unlockedSet = new Set(alreadyUnlockedIds);
  return achievementRules
    .filter((rule) => !unlockedSet.has(rule.id))
    .filter((rule) => rule.isUnlocked(state, user))
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      subtitle: rule.subtitle,
      celebration: rule.celebration,
    }));
}
