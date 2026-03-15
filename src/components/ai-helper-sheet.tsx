"use client";

import { useEffect, useMemo, useState } from "react";
import { askAiHelper, type AiHelperMode, type ProductAiSuggestion } from "@/lib/ai/deepseek";
import { loadLocalDeepSeekApiKey, saveLocalDeepSeekApiKey } from "@/lib/ai/storage";
import type { ProductDraft } from "@/lib/types";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

function productSuggestionToDraft(product: ProductAiSuggestion): ProductDraft {
  return {
    name: product.name,
    icon: "",
    nutritionInputMode: "per100",
    proteinPer100: String(product.proteinPer100),
    fatPer100: String(product.fatPer100),
    carbsPer100: String(product.carbsPer100),
    kcalPer100: String(product.kcalPer100),
    fiberPer100: String(product.fiberPer100),
    magnesiumPer100: String(product.magnesiumPer100),
    ironPer100: String(product.ironPer100),
    zincPer100: String(product.zincPer100),
    omega3Per100: String(product.omega3Per100),
    vitaminB12Per100: String(product.vitaminB12Per100),
    unitMode: product.unitMode,
    unitLabel: product.unitLabel,
    gramsPerUnit: product.gramsPerUnit ? String(product.gramsPerUnit) : "",
  };
}

export function AiHelperSheet({
  open,
  currentPath,
  onClose,
  onCreateProduct,
}: {
  open: boolean;
  currentPath: string;
  onClose: () => void;
  onCreateProduct: (draft: ProductDraft) => void;
}) {
  const [mode, setMode] = useState<AiHelperMode>("app");
  const [apiKey, setApiKey] = useState("");
  const [appQuestion, setAppQuestion] = useState("");
  const [productName, setProductName] = useState("");
  const [productContext, setProductContext] = useState("");
  const [answer, setAnswer] = useState("");
  const [productSuggestion, setProductSuggestion] = useState<ProductAiSuggestion | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setApiKey(loadLocalDeepSeekApiKey());
  }, [open]);

  const canAskApp = Boolean(apiKey.trim() && appQuestion.trim());
  const canAskProduct = Boolean(apiKey.trim() && productName.trim());
  const helperHint = useMemo(
    () =>
      mode === "app"
        ? "Спроси только про это приложение: где что нажать, как добавить еду, как создать продукт."
        : "Напиши название продукта и, если хочешь, уточни бренд, порцию или что это за штука.",
    [mode],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="theme-overlay fixed inset-0 z-[80] flex items-end p-3">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-[#fffdfa] p-4 shadow-[0_24px_70px_rgba(35,43,53,0.24)]">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI-помощник творожка</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Помогает только по приложению и по заполнению нутриентов продукта.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-elevated rounded-full px-3 py-2 text-sm font-semibold text-slate-600"
          >
            Закрыть
          </button>
        </div>

        <div className="theme-important mt-4 rounded-[1.25rem] px-4 py-3 text-sm">
          <div className="font-semibold text-slate-900">Ключ DeepSeek</div>
          <div className="mt-1 text-slate-600">
            Храню ключ только локально в этом браузере. В репозиторий и GitHub Pages он не попадает.
          </div>
          <input
            className={inputClass}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Вставьте свой DeepSeek API key"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSavingKey(true);
                saveLocalDeepSeekApiKey(apiKey);
                window.setTimeout(() => setSavingKey(false), 800);
              }}
              className="theme-accent-button rounded-[1rem] px-4 py-3 text-sm font-semibold"
            >
              {savingKey ? "Сохранено" : "Сохранить ключ"}
            </button>
            <button
              type="button"
              onClick={() => {
                setApiKey("");
                saveLocalDeepSeekApiKey("");
              }}
              className="theme-elevated rounded-[1rem] px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Очистить
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("app");
              setError("");
            }}
            className={`rounded-[1rem] px-4 py-3 text-sm font-semibold ${
              mode === "app" ? "theme-switcher-tab-active text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            По приложению
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("product");
              setError("");
            }}
            className={`rounded-[1rem] px-4 py-3 text-sm font-semibold ${
              mode === "product" ? "theme-switcher-tab-active text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            По продукту
          </button>
        </div>

        <div className="mt-4 rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">{helperHint}</div>

        {mode === "app" ? (
          <div className="mt-4">
            <textarea
              value={appQuestion}
              onChange={(event) => setAppQuestion(event.target.value)}
              placeholder={`Например: как добавить свой продукт на экране ${currentPath}?`}
              className="theme-input min-h-28 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <label className="text-sm font-medium text-slate-600">
              Название продукта
              <input
                className={inputClass}
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="Например, чизбургер или батончик"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Уточнение
              <textarea
                value={productContext}
                onChange={(event) => setProductContext(event.target.value)}
                placeholder="Бренд, вес штуки, вкус, сколько граммов, что это за продукт"
                className="theme-input mt-2 min-h-24 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
              />
            </label>
          </div>
        )}

        {error ? <div className="theme-status-warning mt-4 rounded-[1.1rem] px-4 py-3 text-sm">{error}</div> : null}

        {answer ? (
          <div className="theme-elevated mt-4 rounded-[1.25rem] px-4 py-3 text-sm leading-6 text-slate-700">
            <div className="font-semibold text-slate-900">Ответ</div>
            <div className="mt-2 whitespace-pre-wrap">{answer}</div>
          </div>
        ) : null}

        {productSuggestion ? (
          <div className="theme-important mt-4 rounded-[1.25rem] px-4 py-4 text-sm">
            <div className="font-semibold text-slate-900">{productSuggestion.name}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-slate-700">
              <div>Б {productSuggestion.proteinPer100}</div>
              <div>Ж {productSuggestion.fatPer100}</div>
              <div>У {productSuggestion.carbsPer100}</div>
              <div>{productSuggestion.kcalPer100} ккал</div>
              <div>Клетчатка {productSuggestion.fiberPer100}</div>
              <div>Mg {productSuggestion.magnesiumPer100} мг</div>
              <div>Fe {productSuggestion.ironPer100} мг</div>
              <div>Zn {productSuggestion.zincPer100} мг</div>
              <div>Омега-3 {productSuggestion.omega3Per100}</div>
              <div>B12 {productSuggestion.vitaminB12Per100}</div>
            </div>
            <div className="mt-3 text-xs text-slate-600">
              {productSuggestion.unitMode === "piece" && productSuggestion.gramsPerUnit
                ? `1 ${productSuggestion.unitLabel} ≈ ${productSuggestion.gramsPerUnit} г`
                : "Значения сохраню как продукт по граммам."}
            </div>
            <button
              type="button"
              onClick={() => onCreateProduct(productSuggestionToDraft(productSuggestion))}
              className="theme-accent-button mt-4 rounded-[1rem] px-5 py-3 text-sm font-semibold"
            >
              Создать продукт из ответа AI
            </button>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={async () => {
              setSubmitting(true);
              setError("");
              setAnswer("");
              setProductSuggestion(null);

              try {
                const result = await askAiHelper({
                  apiKey,
                  mode,
                  currentPath,
                  question: mode === "app" ? appQuestion : `Помоги заполнить нутриенты продукта для приложения.`,
                  productName,
                  productContext,
                });

                if (result.mode === "product") {
                  setAnswer(result.answer);
                  setProductSuggestion(result.product);
                } else {
                  setAnswer(result.answer);
                }
              } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "Не удалось спросить AI.");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting || !(mode === "app" ? canAskApp : canAskProduct)}
            className="theme-accent-button rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? "Спрашиваю..." : mode === "app" ? "Спросить AI" : "Подтянуть нутриенты"}
          </button>
        </div>
      </div>
    </div>
  );
}
