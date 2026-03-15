import type { BuiltInMealType } from "@/lib/types";

export type CompanionMessage = {
  key: string;
  text: string;
  mood?: "normal" | "celebration" | "comfort";
};

const mealNames: Record<BuiltInMealType, string> = {
  breakfast: "завтрак",
  lunch: "обед",
  dinner: "ужин",
  snack: "перекус",
};

function pickOne<T>(items: T[], seed: string) {
  const index = Math.abs(seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % items.length;
  return items[index];
}

export function getFirstOpenDayMessage(dateKey: string): CompanionMessage {
  return {
    key: `open-${dateKey}`,
    text: pickOne(
      [
        "Ля-ля, день открыт. Я уже тут внизу сижу.",
        "Ой, новый денек. Я мягонько рад.",
        "Хи-хи, открыли день. Пойдем спокойненько.",
      ],
      dateKey,
    ),
  };
}

export function getMealClosedMessage(mealType: BuiltInMealType, dateKey: string): CompanionMessage {
  return {
    key: `meal-${mealType}-${dateKey}`,
    text: pickOne(
      [
        `Ой, ${mealNames[mealType]} уже закрыт!`,
        `${mealNames[mealType][0].toUpperCase()}${mealNames[mealType].slice(1)} готов, ля-ля.`,
        `Хи-хи, ${mealNames[mealType]} сложился аккуратненько.`,
      ],
      `${mealType}-${dateKey}`,
    ),
    mood: "celebration",
  };
}

export function getLotsLeftMessage(dateKey: string): CompanionMessage {
  return {
    key: `lots-left-${dateKey}`,
    text: pickOne(
      [
        "У тебя еще много калорий, хи-хи. Все спокойно.",
        "Ля-ля, запас еще хороший.",
        "Ой, еды еще хватает. Можно не спешить.",
      ],
      dateKey,
    ),
  };
}

export function getLittleLeftMessage(dateKey: string): CompanionMessage {
  return {
    key: `little-left-${dateKey}`,
    text: pickOne(
      [
        "Ой, уже совсем немножко осталось.",
        "Хи-хи, почти все сложилось.",
        "Ля-ля, денек почти закрыт.",
      ],
      dateKey,
    ),
    mood: "celebration",
  };
}

export function getSteadyDayMessage(dateKey: string): CompanionMessage {
  return {
    key: `steady-${dateKey}`,
    text: pickOne(
      [
        "Ля-ля, как хорошо идем.",
        "Ой как ровненько сегодня.",
        "Хи-хи, очень аккуратный денек.",
      ],
      dateKey,
    ),
  };
}

export function getSlightlyOverMessage(dateKey: string): CompanionMessage {
  return {
    key: `slight-over-${dateKey}`,
    text: pickOne(
      [
        "Ну чуток перебрали, бывает.",
        "Ничего страшного, один денек не шумит.",
        "Ой, чуть вышло сверху. Можно просто спокойно продолжать.",
      ],
      dateKey,
    ),
    mood: "comfort",
  };
}

export function getReturnAfterPauseMessage(dateKey: string): CompanionMessage {
  return {
    key: `return-${dateKey}`,
    text: pickOne(
      [
        "Уааа, ты вернулся. Я все равно очень рад.",
        "Ой, снова вместе. Ничего страшного, продолжаем.",
        "Хи-хи, ты тут. Я тихонько запищал.",
      ],
      dateKey,
    ),
    mood: "celebration",
  };
}

export function getAchievementMessage(id: string, title: string, subtitle: string): CompanionMessage {
  return {
    key: `achievement-${id}`,
    text: `${title}! ${subtitle}`,
    mood: "celebration",
  };
}
