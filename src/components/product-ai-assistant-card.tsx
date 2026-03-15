"use client";

import { useEffect, useRef, useState } from "react";
import { askAiHelper, type ProductAiSuggestion } from "@/lib/ai/deepseek";
import { productSuggestionToDraft } from "@/lib/ai/product-draft";
import { loadLocalDeepSeekApiKey, saveLocalDeepSeekApiKey } from "@/lib/ai/storage";
import type { ProductDraft } from "@/lib/types";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

export function ProductAiAssistantCard({
  currentPath,
  onUseDraft,
}: {
  currentPath: string;
  onUseDraft: (draft: ProductDraft) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [productName, setProductName] = useState("");
  const [productContext, setProductContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [productSuggestion, setProductSuggestion] = useState<ProductAiSuggestion | null>(null);
  const hydratedKeyRef = useRef(false);

  useEffect(() => {
    setApiKey(loadLocalDeepSeekApiKey());
    hydratedKeyRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedKeyRef.current) {
      return;
    }

    saveLocalDeepSeekApiKey(apiKey);
  }, [apiKey]);

  const canAsk = Boolean(apiKey.trim() && productName.trim());

  return (
    <section className="theme-important rounded-[2rem] px-5 py-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">AI-помощник</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Творожок поможет добавить продукт</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Напиши продукт, и я подтяну КБЖУ и нутриенты. Потом сразу открою обычную карточку продукта, где можно
          проверить и сохранить.
        </p>
      </div>

      <div className="mt-4 rounded-[1.4rem] bg-white/80 px-4 py-4">
        <label className="text-sm font-medium text-slate-600">
          Ключ DeepSeek
          <input
            className={inputClass}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Вставьте свой DeepSeek API key"
          />
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">Ключ сохраняется автоматически в этом браузере.</div>
          <button
            type="button"
            onClick={() => setApiKey("")}
            className="theme-elevated rounded-[1rem] px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Очистить
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="text-sm font-medium text-slate-600">
          Какой продукт добавить
          <input
            className={inputClass}
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Например, миндаль, чизбургер, батончик"
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          Уточнение
          <textarea
            value={productContext}
            onChange={(event) => setProductContext(event.target.value)}
            placeholder="Бренд, вес штуки, вкус, упаковка или любая полезная деталь"
            className="theme-input mt-2 min-h-24 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end">
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
                mode: "product",
                currentPath,
                question: "Подбери нутриенты для создания продукта в приложении.",
                productName,
                productContext,
              });

              if (result.mode === "product") {
                setProductSuggestion(result.product);
                setAnswer(result.answer);
              }
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : "Не удалось спросить AI.");
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={!canAsk || submitting}
          className="theme-accent-button rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? "Подбираю..." : "Найти нутриенты"}
        </button>
      </div>

      {error ? <div className="theme-status-warning mt-4 rounded-[1.1rem] px-4 py-3 text-sm">{error}</div> : null}

      {productSuggestion ? (
        <div className="mt-4 rounded-[1.5rem] bg-white/90 px-4 py-4 shadow-[0_16px_30px_rgba(113,82,57,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">{productSuggestion.name}</div>
              <div className="mt-1 text-sm text-slate-600">{answer || productSuggestion.note}</div>
            </div>
            <span className="theme-completed rounded-full px-3 py-1.5 text-xs font-semibold">
              {productSuggestion.unitMode === "piece" && productSuggestion.gramsPerUnit
                ? `1 ${productSuggestion.unitLabel} ≈ ${productSuggestion.gramsPerUnit} г`
                : "На 100 г"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
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

          <button
            type="button"
            onClick={() => onUseDraft(productSuggestionToDraft(productSuggestion))}
            className="theme-accent-button mt-4 w-full rounded-[1rem] px-5 py-3 text-sm font-semibold"
          >
            Открыть карточку продукта
          </button>
        </div>
      ) : null}
    </section>
  );
}
