"use client";

import { useEffect, useState } from "react";

type ThemeMode = "rose" | "beige";

const STORAGE_KEY = "ewl.theme.mode";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "rose";
    }

    return window.localStorage.getItem(STORAGE_KEY) === "beige" ? "beige" : "rose";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const selectTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <div className="mb-4 flex justify-center">
      <div className="inline-grid grid-cols-2 gap-1 rounded-[1.2rem] border border-[var(--color-outline)] bg-white/80 p-1 shadow-[0_10px_24px_rgba(90,105,115,0.1)]">
        <button
          type="button"
          onClick={() => selectTheme("rose")}
          className={`min-h-10 rounded-[1rem] px-4 py-2 text-sm font-semibold transition ${
            theme === "rose" ? "bg-[var(--color-accent)] text-white" : "text-slate-600"
          }`}
        >
          Мягкая
        </button>
        <button
          type="button"
          onClick={() => selectTheme("beige")}
          className={`min-h-10 rounded-[1rem] px-4 py-2 text-sm font-semibold transition ${
            theme === "beige" ? "bg-[var(--color-accent)] text-white" : "text-slate-600"
          }`}
        >
          Бежевая
        </button>
      </div>
    </div>
  );
}
