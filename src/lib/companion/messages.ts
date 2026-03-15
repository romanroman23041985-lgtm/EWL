import type { BuiltInMealType } from "@/lib/types";

export type CompanionMessage = {
  key: string;
  text: string;
  mood?: "normal" | "celebration" | "comfort";
};

export type WeeklyRecapPayload = {
  weekKey: string;
  loggedDays: number;
  comfortDays: number;
  closedMeals: number;
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

export function getOvereatingFirstOpenMessage(dateKey: string): CompanionMessage {
  return {
    key: `stuffed-open-${dateKey}`,
    text: pickOne(
      [
        "Мяу-мяу... я чуток переелся, но всё равно очень рад.",
        "Ой, я сегодня кругляш. Пойдём спокойненько, хи-хи.",
        "Хи-хи, было вкусно. Сегодня можно просто мягонько продолжать.",
      ],
      dateKey,
    ),
    mood: "comfort",
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

export function getOvereatingMealClosedMessage(mealType: BuiltInMealType, dateKey: string): CompanionMessage {
  return {
    key: `stuffed-meal-${mealType}-${dateKey}`,
    text: pickOne(
      [
        `Мяу-мяу, ${mealNames[mealType]} закрыли. Я сытенький и довольный.`,
        `Ой, ${mealNames[mealType]} уже на месте. Кругляшик рад-рад.`,
        `Хи-хи, ${mealNames[mealType]} аккуратно добавился. Я прям пухленько сияю.`,
      ],
      `${mealType}-${dateKey}`,
    ),
    mood: "comfort",
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

export function getOvereatingStatusMessage(dateKey: string, isOverToday: boolean): CompanionMessage {
  return {
    key: isOverToday ? `stuffed-over-${dateKey}` : `stuffed-calm-${dateKey}`,
    text: pickOne(
      isOverToday
        ? [
            "Мяу-мяу... я чуток переелся.",
            "Ой, я сегодня кругляш. Ничего, бывает.",
            "Хи-хи, было вкусно. Один спокойный денёк, и снова будем аккуратненькие.",
          ]
        : [
            "Мяу-мяу, сегодня можно спокойно и ровненько.",
            "Ой, кругляшик уже притих. Один аккуратный денёк очень помогает.",
            "Хи-хи, я всё ещё пухленький, но мы идём мягонько и спокойно.",
          ],
      `${dateKey}-${isOverToday ? "over" : "calm"}`,
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

export function getWeeklyRecapMessage(payload: WeeklyRecapPayload): CompanionMessage {
  const summary =
    payload.loggedDays >= 5
      ? "Ой, неделька получилась очень аккуратная."
      : payload.loggedDays >= 3
        ? "Ля-ля, неделька уже выглядит симпатично."
        : "Хи-хи, неделька тихонько собирается.";

  return {
    key: `weekly-recap-${payload.weekKey}`,
    text: `${payload.loggedDays} дн. с логом, ${payload.comfortDays} аккуратных, ${payload.closedMeals} закрытий. ${summary}`,
    mood: "celebration",
  };
}
