"use client";

import { useEffect, useRef, useState } from "react";
import { askAiHelper, type ProductAiSuggestion } from "@/lib/ai/deepseek";
import { productSuggestionToDraft } from "@/lib/ai/product-draft";
import { loadLocalDeepSeekApiKey, saveLocalDeepSeekApiKey } from "@/lib/ai/storage";
import type { ProductDraft } from "@/lib/types";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

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
  const [apiKey, setApiKey] = useState("");
  const [productName, setProductName] = useState("");
  const [productContext, setProductContext] = useState("");
  const [answer, setAnswer] = useState("");
  const [productSuggestion, setProductSuggestion] = useState<ProductAiSuggestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hydratedKeyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setApiKey(loadLocalDeepSeekApiKey());
    hydratedKeyRef.current = true;
  }, [open]);

  useEffect(() => {
    if (!hydratedKeyRef.current) {
      return;
    }

    saveLocalDeepSeekApiKey(apiKey);
  }, [apiKey]);

  if (!open) {
    return null;
  }

  const canAskProduct = Boolean(apiKey.trim() && productName.trim());

  return (
    <div className="theme-overlay fixed inset-0 z-[80] flex items-end p-3">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-[#fffdfa] p-4 shadow-[0_24px_70px_rgba(35,43,53,0.24)]">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Творожок добавит продукт</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Напиши продукт, а я попробую найти нутриенты через AI и соберу карточку, которую можно сразу сохранить.
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
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">Ключ сохраняется автоматически в этом браузере.</div>
            <button
              type="button"
              onClick={() => {
                setApiKey("");
              }}
              className="theme-elevated rounded-[1rem] px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Очистить
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Сценарий простой: написал продукт, получил КБЖУ и нутриенты, нажал кнопку и создал карточку продукта.
        </div>

        <div className="mt-4 grid gap-4">
          <label className="text-sm font-medium text-slate-600">
            Название продукта
            <input
              className={inputClass}
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Например, миндаль, чизбургер, чокопай"
            />
          </label>

          <label className="text-sm font-medium text-slate-600">
            Уточнение
            <textarea
              value={productContext}
              onChange={(event) => setProductContext(event.target.value)}
              placeholder="Бренд, вес штуки, вкус, упаковка или другая полезная деталь"
              className="theme-input mt-2 min-h-24 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
            />
          </label>
        </div>

        {error ? <div className="theme-status-warning mt-4 rounded-[1.1rem] px-4 py-3 text-sm">{error}</div> : null}

        {answer ? (
          <div className="theme-elevated mt-4 rounded-[1.25rem] px-4 py-3 text-sm leading-6 text-slate-700">
            <div className="font-semibold text-slate-900">Что нашёл творожок</div>
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
                : "Значения будут сохранены как продукт на 100 г."}
            </div>
            <button
              type="button"
              onClick={() => onCreateProduct(productSuggestionToDraft(productSuggestion))}
              className="theme-accent-button mt-4 rounded-[1rem] px-5 py-3 text-sm font-semibold"
            >
              Создать карточку продукта
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
                  mode: "product",
                  currentPath,
                  question: "Подбери нутриенты для создания продукта в приложении.",
                  productName,
                  productContext,
                });

                if (result.mode === "product") {
                  setAnswer(result.answer);
                  setProductSuggestion(result.product);
                }
              } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "Не удалось спросить AI.");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting || !canAskProduct}
            className="theme-accent-button rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? "Ищу нутриенты..." : "Найти и собрать продукт"}
          </button>
        </div>
      </div>
    </div>
  );
}
