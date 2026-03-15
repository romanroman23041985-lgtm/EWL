"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AiHelperSheet } from "@/components/ai-helper-sheet";
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
  getWeeklyRecapMessage,
  type CompanionMessage,
} from "@/lib/companion/messages";
import {
  getHasReturnedAfterPause,
  getOverTargetStreak,
  getPreviousWeekKey,
  getWeekKey,
  getWeeklyRecap,
} from "@/lib/companion/streaks";
import { addDays, clampDateKey, getTodayDate } from "@/lib/date";
import { getDaySummary, getMealSections, getSelectedUser } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";
import type { CompanionState, MascotMode } from "@/lib/types";

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
    <div className="relative h-[92px] w-[92px] drop-shadow-[0_12px_20px_rgba(120,92,66,0.14)]">
      <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="helperGlowSmall" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="rgba(248, 220, 180, 0)" />
          </radialGradient>
          <linearGradient id="bowlFillSmall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff9f0" />
            <stop offset="100%" stopColor="#ecd6b9" />
          </linearGradient>
          <linearGradient id="bowlLipSmall" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="100%" stopColor="#f6dfc4" />
          </linearGradient>
          <linearGradient id="curdFillSmall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="100%" stopColor="#f7ead7" />
          </linearGradient>
          <linearGradient id="creamTopSmall" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffefb" />
            <stop offset="100%" stopColor="#f2dec2" />
          </linearGradient>
          <linearGradient id="spoonMetalSmall" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="100%" stopColor="#cdb79a" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="72" rx="54" ry="54" fill="url(#helperGlowSmall)" />
        <ellipse cx="80" cy="126" rx="12" ry="6.5" fill="#ceb08e" />
        <path
          d="M30 92c0-7 9-12 19-12h62c10 0 19 5 19 12l-4 22c-2 10-10 17-21 17H55c-11 0-19-7-21-17z"
          fill="url(#bowlFillSmall)"
          stroke="#c99963"
          strokeWidth="2.2"
        />
        <ellipse cx="80" cy="93" rx="51" ry="13.5" fill="url(#bowlLipSmall)" stroke="#d4a16f" strokeWidth="2.2" />
        <ellipse cx="80" cy="93" rx="43" ry="9.5" fill="rgba(255,252,247,0.68)" />

        <path
          d="M39 82c0-18 19-33 41-33s41 15 41 33v5H39z"
          fill="url(#curdFillSmall)"
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
        </g>

        <path
          d="M63 42c-1-10 10-17 20-17 12 0 23 10 23 20 0 3 4 5 7 5 8 0 13 6 13 13 0 9-8 15-18 15H73c-14 0-22-7-22-17 0-7 5-12 12-14z"
          fill="url(#creamTopSmall)"
          stroke="#ddb68c"
          strokeWidth="2"
        />
        <path d="M66 43c10-10 23-13 31-7 5 4 6 10 3 14" fill="none" stroke="#fffdf9" strokeWidth="5" strokeLinecap="round" />

        {isOvereating ? (
          <>
            <ellipse cx="55" cy="94" rx="14" ry="12" fill="#fff7ed" opacity="0.95" />
            <ellipse cx="105" cy="94" rx="14" ry="12" fill="#fff7ed" opacity="0.95" />
            <path d="M53 83c4 5 10 5 14 0" fill="none" stroke={eyeFill} strokeWidth="3.4" strokeLinecap="round" />
            <path d="M93 83c4 5 10 5 14 0" fill="none" stroke={eyeFill} strokeWidth="3.4" strokeLinecap="round" />
            <ellipse cx="52" cy="95" rx="9.5" ry="6.8" fill={cheekColor} opacity="0.9" />
            <ellipse cx="108" cy="95" rx="9.5" ry="6.8" fill={cheekColor} opacity="0.9" />
            <path d="M69 99c4 4 18 4 22 0" fill="none" stroke="#6f4b37" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M69 99c2 8 20 8 22 0" fill="#f6a987" stroke="#7c513a" strokeWidth="1.8" strokeLinejoin="round" />
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
            </g>
            <ellipse cx="44" cy="102" rx="8.5" ry="5.4" fill={cheekColor} opacity="0.82" />
            <ellipse cx="116" cy="102" rx="8.5" ry="5.4" fill={cheekColor} opacity="0.82" />
            <path d="M70 95c3 4 17 4 20 0v6c0 7-20 7-20 0z" fill="#f5a07f" stroke="#7b5239" strokeWidth="1.8" strokeLinejoin="round" />
          </>
        )}

        <ellipse cx="43" cy="106" rx="9.5" ry="6.5" fill="#fff8ef" stroke="#d4ad85" strokeWidth="1.6" />
        <path d="M113 104l11-26" fill="none" stroke="#bb8d5c" strokeWidth="3.2" strokeLinecap="round" />
        <ellipse cx="128" cy="73" rx="8.5" ry="12" fill="url(#spoonMetalSmall)" stroke="#b88957" strokeWidth="2" />
      </svg>
    </div>
  );
}

function pickContextMessage(
  pathname: string,
  currentDate: string,
  mascotMode: MascotMode,
  balanceKcal: number,
  targetKcal: number,
  hasItems: boolean,
) {
  if (pathname !== "/today" && pathname !== "/plan") {
    return mascotMode === "overeating" ? getOvereatingFirstOpenMessage(currentDate) : getFirstOpenDayMessage(currentDate);
  }

  if (!hasItems) {
    return mascotMode === "overeating" ? getOvereatingFirstOpenMessage(currentDate) : getFirstOpenDayMessage(currentDate);
  }

  const ratio = targetKcal > 0 ? balanceKcal / targetKcal : 0;
  if (mascotMode === "overeating") {
    return getOvereatingStatusMessage(currentDate, balanceKcal < 0);
  }

  if (balanceKcal < 0 && Math.abs(balanceKcal) <= Math.max(120, Math.round(targetKcal * 0.12))) {
    return getSlightlyOverMessage(currentDate);
  }

  if (balanceKcal > Math.round(targetKcal * 0.35)) {
    return getLotsLeftMessage(currentDate);
  }

  if (balanceKcal > 0 && ratio <= 0.18) {
    return getLittleLeftMessage(currentDate);
  }

  return getSteadyDayMessage(currentDate);
}

export function CottageCheeseHelper() {
  const { state, updateCompanion, createProduct } = useAppStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousDateRef = useRef<string | null>(null);
  const previousMealsRef = useRef<Record<string, number>>({});
  const seenBubbleTokenRef = useRef<string | null>(null);
  const initializedBubbleTokenRef = useRef(false);
  const [visibleBubbleToken, setVisibleBubbleToken] = useState<string | null>(null);
  const [helperOpen, setHelperOpen] = useState(false);

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
    (message: CompanionMessage, extras?: Partial<CompanionState>) => {
      updateCompanion({
        mascotMode,
        ...extras,
        lastMessageKey: message.key,
        lastMessageAt: new Date().toISOString(),
        lastMessageText: message.text,
        lastMessageMood: message.mood ?? "normal",
      });
    },
    [mascotMode, updateCompanion],
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

    const lastMessageMs = state.companion.lastMessageAt ? new Date(state.companion.lastMessageAt).getTime() : 0;
    const hasRecentMessage = Number.isFinite(lastMessageMs) && Date.now() - lastMessageMs < 7000;

    const newAchievements = getUnlockedAchievements(state, user, state.companion.unlockedAchievementIds);
    if (newAchievements.length) {
      const [achievement] = newAchievements;
      rememberMessage(getAchievementMessage(achievement.id, achievement.title, achievement.subtitle), {
        unlockedAchievementIds: [...state.companion.unlockedAchievementIds, ...newAchievements.map((item) => item.id)],
      });
      return;
    }

    const currentWeekKey = getWeekKey(currentDate);
    const previousWeekKey = getPreviousWeekKey(currentDate);
    const recap = getWeeklyRecap(state, user, previousWeekKey);
    const recapWindowOpen = currentDate === currentWeekKey || currentDate === clampDateKey(addDays(currentWeekKey, 1));
    const shouldShowWeeklyRecap =
      (pathname === "/today" || pathname === "/plan") &&
      recapWindowOpen &&
      recap.loggedDays > 0 &&
      currentWeekKey !== previousWeekKey &&
      state.companion.lastWeeklyRecapKey !== previousWeekKey &&
      !hasRecentMessage;

    if (shouldShowWeeklyRecap) {
      rememberMessage(getWeeklyRecapMessage(recap), { lastWeeklyRecapKey: previousWeekKey });
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
      return previousCount === 0 && count > 0 && ["breakfast", "lunch", "dinner"].includes(mealType);
    });

    previousMealsRef.current = mealSnapshot;

    if (closedMeal && !hasRecentMessage) {
      const message =
        mascotMode === "overeating"
          ? getOvereatingMealClosedMessage(closedMeal[0] as "breakfast" | "lunch" | "dinner" | "snack", currentDate)
          : getMealClosedMessage(closedMeal[0] as "breakfast" | "lunch" | "dinner" | "snack", currentDate);
      if (state.companion.lastMessageKey !== message.key) {
        rememberMessage(message);
      }
      return;
    }

    if (pathname !== "/products" && pathname !== "/profile" && getHasReturnedAfterPause(state, user.id) && !hasRecentMessage) {
      const message = getReturnAfterPauseMessage(currentDate);
      if (state.companion.lastMessageKey !== message.key) {
        rememberMessage(message);
      }
      return;
    }

    const openKey = `open-context-${currentDate}`;
    if ((pathname === "/today" || pathname === "/plan") && state.companion.lastMessageKey !== openKey && !hasRecentMessage) {
      const message = pickContextMessage(
        pathname,
        currentDate,
        mascotMode,
        summary.balance?.kcal ?? 0,
        summary.target?.kcal ?? 0,
        summary.items.length > 0,
      );

      rememberMessage({
        ...message,
        key: openKey,
      });
    }
  }, [currentDate, mascotMode, pathname, rememberMessage, sections, state, summary, user]);

  const storedMessage = useMemo(() => {
    if (!state.companion.lastMessageKey || !state.companion.lastMessageAt || !state.companion.lastMessageText) {
      return null;
    }

    return {
      key: state.companion.lastMessageKey,
      text: state.companion.lastMessageText,
      mood: state.companion.lastMessageMood ?? "normal",
      token: `${state.companion.lastMessageKey}-${state.companion.lastMessageAt}`,
    };
  }, [
    state.companion.lastMessageAt,
    state.companion.lastMessageKey,
    state.companion.lastMessageMood,
    state.companion.lastMessageText,
  ]);

  useEffect(() => {
    if (!storedMessage) {
      return;
    }

    if (!initializedBubbleTokenRef.current) {
      initializedBubbleTokenRef.current = true;
      seenBubbleTokenRef.current = storedMessage.token;
      return;
    }

    if (storedMessage.token === seenBubbleTokenRef.current) {
      return;
    }

    seenBubbleTokenRef.current = storedMessage.token;
    const timeout = window.setTimeout(() => setVisibleBubbleToken(storedMessage.token), 0);
    return () => window.clearTimeout(timeout);
  }, [storedMessage]);

  const showBubble = storedMessage?.token === visibleBubbleToken;
  const bubbleMessage = storedMessage
    ? { key: storedMessage.key, text: storedMessage.text, mood: storedMessage.mood } satisfies CompanionMessage
    : null;

  return (
    <>
    <div className="fixed bottom-[calc(5.15rem+env(safe-area-inset-bottom))] right-3 z-30 flex flex-col items-end">
      {showBubble && bubbleMessage ? (
        <div
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) {
              setVisibleBubbleToken(null);
            }
          }}
          className="pointer-events-none mb-1.5 animate-[helper-appear-hide_6.8s_ease-in-out_forwards]"
        >
          <div
            className={`relative max-w-[190px] rounded-[1.2rem] border border-[rgba(122,103,88,0.16)] bg-[var(--color-surface-strong)] px-3.5 py-2.5 text-[12px] leading-5 text-[var(--color-text)] shadow-[0_14px_24px_rgba(95,77,62,0.1)] ${
              bubbleMessage.mood === "celebration"
                ? "theme-important"
                : bubbleMessage.mood === "comfort"
                  ? "theme-status-warning"
                  : "theme-elevated"
            }`}
          >
            <div className="text-balance">{bubbleMessage.text}</div>
            <div className="absolute -bottom-2 right-5 h-4 w-4 rotate-45 border-r border-b border-[rgba(122,103,88,0.16)] bg-[var(--color-surface-strong)]" />
          </div>
        </div>
      ) : null}
      <div className={`${bubbleMessage?.mood === "celebration" ? "animate-[helper-bob_2.1s_ease-in-out_infinite]" : ""}`}>
        <CottageCheeseArtButton
          variant={mascotMode}
          mood={bubbleMessage?.mood ?? "normal"}
          onClick={() => {
            setVisibleBubbleToken(null);
            setHelperOpen(true);
          }}
        />
      </div>
    </div>
      <AiHelperSheet
        open={helperOpen}
        currentPath={pathname}
        onClose={() => setHelperOpen(false)}
        onCreateProduct={(draft) => {
          createProduct(draft);
          setHelperOpen(false);
        }}
      />
    </>
  );
}

function CottageCheeseArtButton({
  variant,
  mood,
  onClick,
}: {
  variant: MascotMode;
  mood?: "normal" | "celebration" | "comfort";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="select-none rounded-full transition hover:scale-[1.02] active:scale-[0.98]"
      aria-label="Открыть AI-помощника творожка"
    >
      <KawaiiCottageCheeseArt variant={variant} mood={mood} />
    </button>
  );
}
