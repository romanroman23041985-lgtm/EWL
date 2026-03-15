"use client";

import { useMemo, useState } from "react";
import { askAiHelper } from "@/lib/ai/deepseek";
import { loadLocalDeepSeekApiKey, saveLocalDeepSeekApiKey } from "@/lib/ai/storage";
import { micronutrientMeta, getPositiveGap } from "@/lib/nutrients";
import type { DaySummary } from "@/lib/types";

function formatDayContext(summary: DaySummary) {
  const target = summary.target;
  const balance = summary.balance;

  return [
    `Факт: ${summary.totals.kcal} ккал, Б ${summary.totals.protein}, Ж ${summary.totals.fat}, У ${summary.totals.carbs}.`,
    `Цель: ${target?.kcal ?? 0} ккал, Б ${target?.protein ?? 0}, Ж ${target?.fat ?? 0}, У ${target?.carbs ?? 0}.`,
    `Остаток: ${balance?.kcal ?? 0} ккал, Б ${balance?.protein ?? 0}, Ж ${balance?.fat ?? 0}, У ${balance?.carbs ?? 0}.`,
    `Дефициты нутриентов: ${micronutrientMeta
      .map((nutrient) => `${nutrient.label} ${getPositiveGap(balance?.[nutrient.key] ?? 0)} ${nutrient.unit}`)
      .join(", ")}.`,
  ].join(" ");
}

export function DayAiAssistantCard({
  summary,
  currentPath,
  dinnerClosed,
}: {
  summary: DaySummary;
  currentPath: string;
  dinnerClosed: boolean;
}) {
  const [apiKey, setApiKey] = useState(() => loadLocalDeepSeekApiKey());
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const missingItems = useMemo(() => {
    if (!summary.balance) {
      return [];
    }

    const macroItems = [
      summary.balance.protein > 0 ? `белок ${summary.balance.protein} г` : null,
      summary.balance.fat > 0 ? `жиры ${summary.balance.fat} г` : null,
      summary.balance.carbs > 0 ? `углеводы ${summary.balance.carbs} г` : null,
      summary.balance.kcal > 0 ? `калории ${summary.balance.kcal}` : null,
    ].filter(Boolean) as string[];

    const micronutrientItems = micronutrientMeta
      .map((nutrient) => {
        const gap = getPositiveGap(summary.balance?.[nutrient.key] ?? 0);
        return gap > 0 ? `${nutrient.label.toLowerCase()} ${gap} ${nutrient.unit}` : null;
      })
      .filter(Boolean) as string[];

    return [...macroItems, ...micronutrientItems].slice(0, 6);
  }, [summary.balance]);

  const quickQuestions = [
    "Чем лучше добрать остаток дня?",
    "Что съесть легко на оставшиеся калории?",
    "Как закрыть белок без перегруза?",
  ];

  const isRelevant =
    summary.items.length > 0 &&
    Boolean(summary.balance) &&
    (dinnerClosed || (summary.balance?.kcal ?? 0) <= 450 || (summary.balance?.kcal ?? 0) <= 0);

  if (!isRelevant) {
    return null;
  }

  return (
    <section className="app-card rounded-[2rem] p-5">
      <div className="flex items-start gap-3">
        <div className="theme-important flex h-12 w-12 items-center justify-center rounded-full text-2xl">🍚</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Творожок подскажет по дню</h2>
          <p className="mt-1 text-sm text-slate-500">
            Видит, сколько уже съедено, сколько осталось и чего еще не хватает.
          </p>
        </div>
      </div>

      {missingItems.length ? (
        <div className="theme-important mt-4 rounded-[1.35rem] px-4 py-4">
          <div className="text-sm font-semibold text-slate-900">Вам не хватает</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingItems.map((item) => (
              <span key={item} className="rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="theme-completed mt-4 rounded-[1.35rem] px-4 py-4 text-sm text-slate-700">
          День уже почти или полностью закрыт. Можно просто спокойно закончить его без добора.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {quickQuestions.map((quickQuestion) => (
          <button
            key={quickQuestion}
            type="button"
            onClick={() => setQuestion(quickQuestion)}
            className="theme-elevated rounded-full px-3 py-2 text-xs font-semibold text-slate-700"
          >
            {quickQuestion}
          </button>
        ))}
      </div>

      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Например: чем добрать белок и клетчатку на остаток дня?"
        className="theme-input mt-4 min-h-24 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
      />

      {!apiKey ? (
        <div className="theme-elevated mt-4 rounded-[1.25rem] px-4 py-4 text-sm text-slate-600">
          <div className="font-semibold text-slate-900">Нужен ваш DeepSeek API key</div>
          <div className="mt-1">Сохраняю его только локально в этом браузере.</div>
          <button
            type="button"
            onClick={() => setShowKeyInput((value) => !value)}
            className="theme-accent-button mt-3 rounded-[1rem] px-4 py-3 text-sm font-semibold"
          >
            {showKeyInput ? "Скрыть поле ключа" : "Ввести ключ"}
          </button>
          {showKeyInput ? (
            <div className="mt-3">
              <input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Вставьте свой DeepSeek API key"
                className="theme-input h-12 w-full rounded-[1rem] border border-[var(--color-outline)] px-4 outline-none"
              />
              <button
                type="button"
                onClick={() => saveLocalDeepSeekApiKey(apiKey)}
                className="theme-accent-button mt-3 rounded-[1rem] px-4 py-3 text-sm font-semibold"
              >
                Сохранить ключ
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <div className="theme-status-warning mt-4 rounded-[1.1rem] px-4 py-3 text-sm">{error}</div> : null}

      {answer ? (
        <div className="theme-elevated mt-4 rounded-[1.25rem] px-4 py-4 text-sm leading-6 text-slate-700">
          <div className="font-semibold text-slate-900">Ответ AI</div>
          <div className="mt-2 whitespace-pre-wrap">{answer}</div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={async () => {
            if (!apiKey.trim() || !question.trim()) {
              return;
            }

            setSubmitting(true);
            setError("");
            setAnswer("");
            saveLocalDeepSeekApiKey(apiKey);

            try {
              const result = await askAiHelper({
                apiKey,
                mode: "day",
                question,
                currentPath,
                dayContext: formatDayContext(summary),
              });

              setAnswer(result.answer);
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : "Не удалось спросить AI.");
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={submitting || !apiKey.trim() || !question.trim()}
          className="theme-accent-button rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? "Спрашиваю..." : "Спросить AI чем добрать"}
        </button>
      </div>
    </section>
  );
}
