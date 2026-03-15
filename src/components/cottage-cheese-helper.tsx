"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getUnlockedAchievements } from "@/lib/companion/achievements";
import {
  getAchievementMessage,
  getFirstOpenDayMessage,
  getLittleLeftMessage,
  getLotsLeftMessage,
  getMealClosedMessage,
  getReturnAfterPauseMessage,
  getSlightlyOverMessage,
  getSteadyDayMessage,
  type CompanionMessage,
} from "@/lib/companion/messages";
import { getHasReturnedAfterPause, getLoggingStreak } from "@/lib/companion/streaks";
import { clampDateKey, getTodayDate } from "@/lib/date";
import { getDaySummary, getMealSections, getSelectedUser } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";

function CottageCheeseFace({ mood = "normal" }: { mood?: "normal" | "celebration" | "comfort" }) {
  const blushClass = mood === "comfort" ? "bg-[#f2c7b6]" : "bg-[#f7cdb8]";

  return (
    <div className="relative h-[112px] w-[112px]">
      <div className="absolute inset-x-3 bottom-0 h-14 rounded-[999px_999px_22px_22px] border border-[#dbc3aa] bg-[linear-gradient(180deg,#f8efe3,#e8d4bc)] shadow-[0_12px_30px_rgba(95,77,62,0.18)]" />
      <div className="absolute inset-x-5 bottom-8 h-16 rounded-[40px] bg-[linear-gradient(180deg,#fffaf2,#f5e8d4)]">
        <div className="absolute inset-x-1 top-2 bottom-1 rounded-[36px] bg-[radial-gradient(circle_at_18%_20%,#fffefb_0,#fff7ec_36%,transparent_37%),radial-gradient(circle_at_52%_46%,#fff9ef_0,#fff0df_35%,transparent_36%),radial-gradient(circle_at_76%_30%,#fffdf8_0,#f8ebda_30%,transparent_31%),radial-gradient(circle_at_62%_72%,#fcf5e9_0,#f3e2cc_34%,transparent_35%),radial-gradient(circle_at_28%_70%,#fffdf8_0,#f2e4d0_32%,transparent_33%)]" />
      </div>
      <div className="absolute left-9 top-[54px] h-5 w-5 rounded-full bg-[#6d4f3a]" />
      <div className="absolute right-9 top-[54px] h-5 w-5 rounded-full bg-[#6d4f3a]" />
      <div className="absolute left-[42px] top-[58px] h-2.5 w-2.5 rounded-full bg-white" />
      <div className="absolute right-[42px] top-[58px] h-2.5 w-2.5 rounded-full bg-white" />
      <div className={`absolute left-6 top-[72px] h-4 w-5 rounded-full opacity-75 ${blushClass}`} />
      <div className={`absolute right-6 top-[72px] h-4 w-5 rounded-full opacity-75 ${blushClass}`} />
      <div className="absolute left-1/2 top-[74px] h-5 w-7 -translate-x-1/2 rounded-[0_0_18px_18px] border-x border-b border-[#734e39] bg-[#ffb78d]" />
      <div className="absolute left-[26px] bottom-[22px] h-3 w-5 rounded-full border border-[#c9a98e] bg-[#fff7ea]" />
      <div className="absolute right-[18px] bottom-[22px] h-10 w-3 origin-bottom rotate-[18deg] rounded-full bg-[#d1b79b]" />
      <div className="absolute right-[9px] bottom-[48px] h-7 w-5 rounded-full border border-[#ccb093] bg-[linear-gradient(180deg,#fffefc,#efe4d3)] shadow-sm" />
      <div className="absolute left-[42px] top-0 h-10 w-7 rounded-[18px_18px_24px_24px] bg-[linear-gradient(180deg,#fffef9,#f3dec1)] shadow-[0_6px_18px_rgba(171,134,88,0.18)]" />
    </div>
  );
}

export function CottageCheeseHelper() {
  const { state, updateCompanion } = useAppStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousDateRef = useRef<string | null>(null);
  const previousMealsRef = useRef<Record<string, number>>({});

  const user = getSelectedUser(state);
  const currentDate = useMemo(() => {
    if (pathname === "/plan") {
      return clampDateKey(searchParams.get("date"));
    }

    return getTodayDate();
  }, [pathname, searchParams]);

  const summary = useMemo(() => getDaySummary(state, user, currentDate), [state, user, currentDate]);
  const sections = useMemo(() => getMealSections(summary), [summary]);

  const rememberMessage = useCallback(
    (message: CompanionMessage, unlockedIds?: string[]) => {
      updateCompanion({
        unlockedAchievementIds: unlockedIds ?? state.companion.unlockedAchievementIds,
        lastMessageKey: message.key,
        lastMessageAt: new Date().toISOString(),
        lastMessageText: message.text,
        lastMessageMood: message.mood ?? "normal",
      });
    },
    [state.companion.unlockedAchievementIds, updateCompanion],
  );

  useEffect(() => {
    if (!state.hydrated || !user) {
      return;
    }

    const newAchievements = getUnlockedAchievements(state, user, state.companion.unlockedAchievementIds);
    if (newAchievements.length) {
      const [achievement] = newAchievements;
      rememberMessage(getAchievementMessage(achievement.id, achievement.title, achievement.subtitle), [
        ...state.companion.unlockedAchievementIds,
        ...newAchievements.map((item) => item.id),
      ]);
      return;
    }

    const mealSnapshot = Object.fromEntries(
      sections.filter((section) => section.mealType !== "custom").map((section) => [section.mealType, section.rows.length]),
    );

    if (previousDateRef.current !== currentDate) {
      previousDateRef.current = currentDate;
      previousMealsRef.current = mealSnapshot;
    }

    const closedMeal = (Object.entries(mealSnapshot) as Array<[string, number]>).find(([mealType, count]) => {
      const previousCount = previousMealsRef.current[mealType] ?? 0;
      return previousCount === 0 && count > 0 && ["breakfast", "lunch", "dinner", "snack"].includes(mealType);
    });

    previousMealsRef.current = mealSnapshot;

    if (closedMeal) {
      const message = getMealClosedMessage(closedMeal[0] as "breakfast" | "lunch" | "dinner" | "snack", currentDate);
      if (state.companion.lastMessageKey !== message.key) {
        rememberMessage(message);
      }
      return;
    }

    if (pathname !== "/products" && pathname !== "/profile" && getHasReturnedAfterPause(state, user.id)) {
      const message = getReturnAfterPauseMessage(currentDate);
      if (state.companion.lastMessageKey !== message.key) {
        rememberMessage(message);
      }
      return;
    }

    if ((pathname === "/today" || pathname === "/plan") && state.companion.lastMessageKey !== `open-${currentDate}`) {
      const message = getFirstOpenDayMessage(currentDate);
      rememberMessage(message);
    }
  }, [currentDate, pathname, rememberMessage, sections, state, user]);

  const fallbackMessage = useMemo(() => {
    if (!user) {
      return {
        key: "no-user",
        text: "Ля-ля, сначала профиль. Я тут маленько подожду.",
      } satisfies CompanionMessage;
    }

    if (pathname === "/today" || pathname === "/plan") {
      const balance = summary.balance?.kcal ?? 0;
      const target = summary.target?.kcal ?? 0;
      const ratio = target > 0 ? balance / target : 0;

      if (balance < 0 && Math.abs(balance) <= Math.max(120, Math.round(target * 0.12))) {
        return getSlightlyOverMessage(currentDate);
      }

      if (balance > Math.round(target * 0.35)) {
        return getLotsLeftMessage(currentDate);
      }

      if (balance > 0 && ratio <= 0.18) {
        return getLittleLeftMessage(currentDate);
      }

      return getSteadyDayMessage(currentDate);
    }

    const streak = user ? getLoggingStreak(state, user.id) : 0;
    if (streak >= 3) {
      return {
        key: `streak-${streak}`,
        text: `Ля-ля, уже ${streak} дней. Я почти запищал.`,
        mood: "celebration",
      } satisfies CompanionMessage;
    }

    return {
      key: "idle",
      text: "Ой, я тут. Тихонько радуюсь рядышком.",
    } satisfies CompanionMessage;
  }, [currentDate, pathname, state, summary, user]);

  const eventMessage = useMemo(() => {
    if (!state.companion.lastMessageKey || !state.companion.lastMessageAt || !state.companion.lastMessageText) {
      return null;
    }

    return {
      key: state.companion.lastMessageKey,
      text: state.companion.lastMessageText,
      mood: state.companion.lastMessageMood ?? "normal",
    } satisfies CompanionMessage;
  }, [
    state.companion.lastMessageAt,
    state.companion.lastMessageKey,
    state.companion.lastMessageMood,
    state.companion.lastMessageText,
  ]);

  const message = eventMessage ?? fallbackMessage;

  return (
    <div className="pointer-events-none fixed bottom-[calc(5.4rem+env(safe-area-inset-bottom))] right-4 z-30 flex max-w-[240px] flex-col items-end">
      <div
        className={`relative mb-2 rounded-[1.4rem] border border-[rgba(122,103,88,0.16)] bg-[var(--color-surface-strong)] px-4 py-3 text-sm leading-6 text-[var(--color-text)] shadow-[0_16px_34px_rgba(95,77,62,0.12)] ${
          message.mood === "celebration"
            ? "theme-important"
            : message.mood === "comfort"
              ? "theme-status-warning"
              : "theme-elevated"
        }`}
      >
        <div className="max-w-[210px] text-balance">{message.text}</div>
        <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-r border-b border-[rgba(122,103,88,0.16)] bg-[var(--color-surface-strong)]" />
      </div>
      <div
        className={`rounded-[2rem] bg-transparent transition ${
          message.mood === "celebration" ? "animate-[helper-bob_1.9s_ease-in-out_infinite]" : ""
        }`}
      >
        <CottageCheeseFace mood={message.mood} />
      </div>
    </div>
  );
}
