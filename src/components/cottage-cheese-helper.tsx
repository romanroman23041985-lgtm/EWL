"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getUnlockedAchievements } from "@/lib/companion/achievements";
import {
  getAchievementMessage,
  getFirstOpenDayMessage,
  getLittleLeftMessage,
  getLotsLeftMessage,
  getMealClosedMessage,
  getOvereatingFirstOpenMessage,
  getOvereatingMealClosedMessage,
  getOvereatingStatusMessage,
  getReturnAfterPauseMessage,
  getSlightlyOverMessage,
  getSteadyDayMessage,
  type CompanionMessage,
} from "@/lib/companion/messages";
import { getHasReturnedAfterPause, getLoggingStreak, getOverTargetStreak } from "@/lib/companion/streaks";
import { clampDateKey, getTodayDate } from "@/lib/date";
import { getDaySummary, getMealSections, getSelectedUser } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";
import type { MascotMode } from "@/lib/types";

function KawaiiCottageCheeseArt({
  variant,
  mood,
}: {
  variant: MascotMode;
  mood?: "normal" | "celebration" | "comfort";
}) {
  const isOvereating = variant === "overeating";
  const glowColor = isOvereating ? "rgba(248, 213, 156, 0.54)" : "rgba(252, 224, 172, 0.5)";
  const cheekColor = mood === "comfort" ? "#f5c8bc" : "#f8d2c4";
  const eyeFill = "#6f4b37";

  return (
    <div className="relative h-[118px] w-[118px] drop-shadow-[0_16px_24px_rgba(120,92,66,0.18)]">
      <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="helperGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="rgba(248, 220, 180, 0)" />
          </radialGradient>
          <linearGradient id="bowlFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff9f0" />
            <stop offset="100%" stopColor="#ecd6b9" />
          </linearGradient>
          <linearGradient id="bowlLip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="100%" stopColor="#f6dfc4" />
          </linearGradient>
          <linearGradient id="curdFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="100%" stopColor="#f7ead7" />
          </linearGradient>
          <linearGradient id="creamTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffefb" />
            <stop offset="100%" stopColor="#f2dec2" />
          </linearGradient>
          <linearGradient id="spoonMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="100%" stopColor="#cdb79a" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="72" rx="54" ry="54" fill="url(#helperGlow)" />

        <ellipse cx="80" cy="126" rx="12" ry="6.5" fill="#ceb08e" />
        <ellipse cx="58" cy="136" rx="5" ry="3" fill="#c49d72" />
        <ellipse cx="102" cy="136" rx="5" ry="3" fill="#c49d72" />

        <path
          d="M30 92c0-7 9-12 19-12h62c10 0 19 5 19 12l-4 22c-2 10-10 17-21 17H55c-11 0-19-7-21-17z"
          fill="url(#bowlFill)"
          stroke="#c99963"
          strokeWidth="2.2"
        />
        <ellipse cx="80" cy="93" rx="51" ry="13.5" fill="url(#bowlLip)" stroke="#d4a16f" strokeWidth="2.2" />
        <ellipse cx="80" cy="93" rx="43" ry="9.5" fill="rgba(255,252,247,0.68)" />

        <path
          d="M39 82c0-18 19-33 41-33s41 15 41 33v5H39z"
          fill="url(#curdFill)"
          stroke="#e6cfb1"
          strokeWidth="1.6"
        />

        <g fill="#fffaf2" stroke="#efdcc3" strokeWidth="1.5">
          <circle cx="42" cy="83" r="9" />
          <circle cx="52" cy="73" r="9" />
          <circle cx="63" cy="68" r="10" />
          <circle cx="77" cy="66" r="11" />
          <circle cx="92" cy="68" r="10" />
          <circle cx="106" cy="72" r="9" />
          <circle cx="117" cy="81" r="9" />
          <circle cx="48" cy="93" r="8" />
          <circle cx="61" cy="89" r="9" />
          <circle cx="74" cy="88" r="9" />
          <circle cx="87" cy="88" r="9" />
          <circle cx="100" cy="89" r="9" />
          <circle cx="112" cy="94" r="8" />
          <circle cx="53" cy="102" r="7.5" />
          <circle cx="68" cy="101" r="8" />
          <circle cx="80" cy="102" r="7.5" />
          <circle cx="93" cy="101" r="8" />
          <circle cx="107" cy="102" r="7.5" />
        </g>

        <path
          d="M63 42c-1-10 10-17 20-17 12 0 23 10 23 20 0 3 4 5 7 5 8 0 13 6 13 13 0 9-8 15-18 15H73c-14 0-22-7-22-17 0-7 5-12 12-14z"
          fill="url(#creamTop)"
          stroke="#ddb68c"
          strokeWidth="2"
        />
        <path
          d="M66 43c10-10 23-13 31-7 5 4 6 10 3 14"
          fill="none"
          stroke="#fffdf9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M72 30c8-4 17-2 22 4 4 5 4 10 1 14"
          fill="none"
          stroke="#fff5e8"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {isOvereating ? (
          <>
            <ellipse cx="55" cy="94" rx="14" ry="12" fill="#fff7ed" opacity="0.95" />
            <ellipse cx="105" cy="94" rx="14" ry="12" fill="#fff7ed" opacity="0.95" />
            <path d="M53 83c4 5 10 5 14 0" fill="none" stroke={eyeFill} strokeWidth="3.4" strokeLinecap="round" />
            <path d="M93 83c4 5 10 5 14 0" fill="none" stroke={eyeFill} strokeWidth="3.4" strokeLinecap="round" />
            <ellipse cx="52" cy="95" rx="9.5" ry="6.8" fill={cheekColor} opacity="0.9" />
            <ellipse cx="108" cy="95" rx="9.5" ry="6.8" fill={cheekColor} opacity="0.9" />
            <path
              d="M69 99c4 4 18 4 22 0"
              fill="none"
              stroke="#6f4b37"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M69 99c2 8 20 8 22 0"
              fill="#f6a987"
              stroke="#7c513a"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="82" cy="101" r="4.5" fill="#fff6ed" opacity="0.9" />
          </>
        ) : (
          <>
            <path d="M49 74c3-3 8-3 11 0" fill="none" stroke="#7b573f" strokeWidth="2" strokeLinecap="round" />
            <path d="M100 74c3-3 8-3 11 0" fill="none" stroke="#7b573f" strokeWidth="2" strokeLinecap="round" />
            <g>
              <ellipse cx="57" cy="90" rx="10.5" ry="12" fill={eyeFill} />
              <ellipse cx="103" cy="90" rx="10.5" ry="12" fill={eyeFill} />
              <ellipse cx="60" cy="87" rx="4.5" ry="5.4" fill="#fffefc" />
              <ellipse cx="106" cy="87" rx="4.5" ry="5.4" fill="#fffefc" />
              <ellipse cx="54" cy="94" rx="2.2" ry="2.5" fill="#f6d4aa" opacity="0.9" />
              <ellipse cx="100" cy="94" rx="2.2" ry="2.5" fill="#f6d4aa" opacity="0.9" />
            </g>
            <ellipse cx="44" cy="102" rx="8.5" ry="5.4" fill={cheekColor} opacity="0.82" />
            <ellipse cx="116" cy="102" rx="8.5" ry="5.4" fill={cheekColor} opacity="0.82" />
            <path
              d="M70 95c3 4 17 4 20 0v6c0 7-20 7-20 0z"
              fill="#f5a07f"
              stroke="#7b5239"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </>
        )}

        <ellipse cx="43" cy="106" rx="9.5" ry="6.5" fill="#fff8ef" stroke="#d4ad85" strokeWidth="1.6" />
        <path d="M113 104l11-26" fill="none" stroke="#bb8d5c" strokeWidth="3.2" strokeLinecap="round" />
        <ellipse cx="128" cy="73" rx="8.5" ry="12" fill="url(#spoonMetal)" stroke="#b88957" strokeWidth="2" />
        <ellipse cx="129.5" cy="68.5" rx="2.7" ry="3.4" fill="#fffefb" opacity="0.9" />
      </svg>
    </div>
  );
}

function DefaultCottageCheeseFace({ mood = "normal" }: { mood?: "normal" | "celebration" | "comfort" }) {
  return <KawaiiCottageCheeseArt variant="default" mood={mood} />;
}

function OvereatingCottageCheeseFace({ mood = "comfort" }: { mood?: "normal" | "celebration" | "comfort" }) {
  return <KawaiiCottageCheeseArt variant="overeating" mood={mood} />;
}

function CottageCheeseFace({
  mood = "normal",
  variant = "default",
}: {
  mood?: "normal" | "celebration" | "comfort";
  variant?: MascotMode;
}) {
  if (variant === "overeating") {
    return <OvereatingCottageCheeseFace mood={mood} />;
  }

  return <DefaultCottageCheeseFace mood={mood} />;
}

export function CottageCheeseHelper() {
  const { state, updateCompanion } = useAppStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousDateRef = useRef<string | null>(null);
  const previousMealsRef = useRef<Record<string, number>>({});
  const [displayCycle, setDisplayCycle] = useState(0);
  const [hiddenDisplayToken, setHiddenDisplayToken] = useState<string | null>(null);

  const user = getSelectedUser(state);
  const currentDate = useMemo(() => {
    if (pathname === "/plan") {
      return clampDateKey(searchParams.get("date"));
    }

    return getTodayDate();
  }, [pathname, searchParams]);

  const summary = useMemo(() => getDaySummary(state, user, currentDate), [state, user, currentDate]);
  const sections = useMemo(() => getMealSections(summary), [summary]);
  const mascotMode = useMemo<MascotMode>(() => {
    if (!user) {
      return "default";
    }

    return getOverTargetStreak(state, user) >= 3 ? "overeating" : "default";
  }, [state, user]);

  const rememberMessage = useCallback(
    (message: CompanionMessage, unlockedIds?: string[]) => {
      updateCompanion({
        mascotMode,
        unlockedAchievementIds: unlockedIds ?? state.companion.unlockedAchievementIds,
        lastMessageKey: message.key,
        lastMessageAt: new Date().toISOString(),
        lastMessageText: message.text,
        lastMessageMood: message.mood ?? "normal",
      });
    },
    [mascotMode, state.companion.unlockedAchievementIds, updateCompanion],
  );

  useEffect(() => {
    if (!state.hydrated || state.companion.mascotMode === mascotMode) {
      return;
    }

    updateCompanion({ mascotMode });
  }, [mascotMode, state.companion.mascotMode, state.hydrated, updateCompanion]);

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
      sections
        .filter((section) => section.mealType !== "custom")
        .map((section) => [section.mealType, section.rows.length]),
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
      const message =
        mascotMode === "overeating"
          ? getOvereatingMealClosedMessage(
              closedMeal[0] as "breakfast" | "lunch" | "dinner" | "snack",
              currentDate,
            )
          : getMealClosedMessage(closedMeal[0] as "breakfast" | "lunch" | "dinner" | "snack", currentDate);

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

    const openKey = mascotMode === "overeating" ? `stuffed-open-${currentDate}` : `open-${currentDate}`;

    if ((pathname === "/today" || pathname === "/plan") && state.companion.lastMessageKey !== openKey) {
      const message =
        mascotMode === "overeating" ? getOvereatingFirstOpenMessage(currentDate) : getFirstOpenDayMessage(currentDate);
      rememberMessage(message);
    }
  }, [currentDate, mascotMode, pathname, rememberMessage, sections, state, user]);

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

      if (mascotMode === "overeating") {
        return getOvereatingStatusMessage(currentDate, balance < 0);
      }

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

    const streak = getLoggingStreak(state, user.id);
    if (streak >= 3) {
      return {
        key: `streak-${streak}`,
        text: `Ля-ля, уже ${streak} дней. Я почти запищал.`,
        mood: "celebration",
      } satisfies CompanionMessage;
    }

    if (mascotMode === "overeating") {
      return {
        key: "stuffed-idle",
        text: "Мяу-мяу, я пока кругляшик. Ничего, спокойно идем дальше.",
        mood: "comfort",
      } satisfies CompanionMessage;
    }

    return {
      key: "idle",
      text: "Ой, я тут. Тихонько радуюсь рядышком.",
    } satisfies CompanionMessage;
  }, [currentDate, mascotMode, pathname, state, summary, user]);

  const storedMessage = useMemo(() => {
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

  const message = storedMessage ?? fallbackMessage;
  const baseToken =
    storedMessage && state.companion.lastMessageAt ? `${storedMessage.key}-${state.companion.lastMessageAt}` : null;
  const displayToken = baseToken ? `${baseToken}-${displayCycle}` : null;
  const isExpanded = Boolean(displayToken && hiddenDisplayToken !== displayToken);
  const canRecall = Boolean(message.text);

  const dismissHelper = useCallback(() => {
    if (displayToken) {
      setHiddenDisplayToken(displayToken);
    }
  }, [displayToken]);

  const revealHelper = useCallback(() => {
    if (!canRecall) {
      return;
    }

    setDisplayCycle((value) => value + 1);
    setHiddenDisplayToken(null);
  }, [canRecall]);

  if (!canRecall) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom))] right-3 z-30 flex max-w-[240px] flex-col items-end">
      {isExpanded ? (
        <button
          type="button"
          aria-label="Скрыть творожка"
          onClick={dismissHelper}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && displayToken) {
              setHiddenDisplayToken(displayToken);
            }
          }}
          className="pointer-events-auto flex flex-col items-end animate-[helper-appear-hide_8.8s_ease-in-out_forwards] bg-transparent p-0 text-left"
        >
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
            <CottageCheeseFace mood={message.mood} variant={mascotMode} />
          </div>
        </button>
      ) : (
        <button
          type="button"
          aria-label="Показать последнюю реплику творожка"
          onClick={revealHelper}
          className="pointer-events-auto flex h-14 w-14 items-end justify-end overflow-hidden rounded-full border border-[rgba(122,103,88,0.16)] bg-[var(--color-surface-strong)] shadow-[0_14px_28px_rgba(95,77,62,0.14)]"
        >
          <div className="origin-bottom-right scale-[0.52]">
            <CottageCheeseFace mood={message.mood} variant={mascotMode} />
          </div>
        </button>
      )}
    </div>
  );
}
