"use client";

import { useEffect } from "react";
import type { ThemeMode } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const themeOptions: Array<{ id: ThemeMode; label: string; hint: string }> = [
  { id: "rose", label: "Мягкая", hint: "светлая и нежная" },
  { id: "beige", label: "Бежевая", hint: "спокойная и теплая" },
];

export function ThemeSwitcher() {
  const { state, setThemeMode } = useAppStore();
  const theme = state.themeMode;

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    document.documentElement.dataset.theme = theme;
  }, [state.hydrated, theme]);

  const selectTheme = (nextTheme: ThemeMode) => {
    setThemeMode(nextTheme);
  };

  return (
    <div className="mb-4 flex justify-center">
      <div className="theme-switcher-shell inline-grid grid-cols-2 gap-1 rounded-[1.25rem] p-1.5">
        {themeOptions.map((option) => {
          const active = theme === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectTheme(option.id)}
              className={`min-h-11 rounded-[1rem] px-4 py-2 text-left transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-shell)] ${
                active ? "theme-switcher-tab-active text-white" : "text-slate-600"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="block text-sm font-semibold">{option.label}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    active ? "bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.16)]" : "bg-[var(--color-outline)]"
                  }`}
                />
              </span>
              <span className={`mt-0.5 block text-[11px] ${active ? "text-white/80" : "text-slate-500"}`}>
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
