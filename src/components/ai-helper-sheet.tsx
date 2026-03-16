"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { askAiHelper, type ProductAiSuggestion } from "@/lib/ai/deepseek";
import { productSuggestionToDraft } from "@/lib/ai/product-draft";
import type { AiHelperLaunchPayload } from "@/lib/ai/helper-launch";
import { loadLocalDeepSeekApiKey, saveLocalDeepSeekApiKey } from "@/lib/ai/storage";
import type { ProductDraft } from "@/lib/types";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";
const sectionCardClass = "mt-4 rounded-[1.35rem] border border-[rgba(122,103,88,0.12)] bg-white/72 px-4 py-4";

type HelperTab = "product" | "chat";

export function AiHelperSheet({
  open,
  currentPath,
  onClose,
  onCreateProduct,
  launchRequest,
  defaultDayContext,
}: {
  open: boolean;
  currentPath: string;
  onClose: () => void;
  onCreateProduct: (draft: ProductDraft) => void;
  launchRequest?: (AiHelperLaunchPayload & { id: string }) | null;
  defaultDayContext?: string;
}) {
  const [tab, setTab] = useState<HelperTab>("product");
  const [apiKey, setApiKey] = useState("");
  const [productName, setProductName] = useState("");
  const [productContext, setProductContext] = useState("");
  const [productAnswer, setProductAnswer] = useState("");
  const [productSuggestion, setProductSuggestion] = useState<ProductAiSuggestion | null>(null);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hydratedKeyRef = useRef(false);
  const handledLaunchIdRef = useRef<string | null>(null);

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

  const canAskProduct = Boolean(apiKey.trim() && productName.trim());
  const canAskChat = Boolean(apiKey.trim() && chatQuestion.trim());

  const submitProductRequest = useCallback(async () => {
    setSubmitting(true);
    setError("");
    setProductAnswer("");
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
        setProductAnswer(result.answer);
        setProductSuggestion(result.product);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось спросить AI.");
    } finally {
      setSubmitting(false);
    }
  }, [apiKey, currentPath, productContext, productName]);

  const submitChatRequest = useCallback(
    async (questionOverride?: string, dayContextOverride?: string) => {
      const prompt = (questionOverride ?? chatQuestion).trim();
      if (!prompt || !apiKey.trim()) {
        return;
      }

      setSubmitting(true);
      setError("");
      setChatAnswer("");

      try {
        const result = await askAiHelper({
          apiKey,
          mode: "chat",
          currentPath,
          question: prompt,
          dayContext: dayContextOverride ?? defaultDayContext,
        });

        if (result.mode === "chat") {
          setChatAnswer(result.answer);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось спросить AI.");
      } finally {
        setSubmitting(false);
      }
    },
    [apiKey, chatQuestion, currentPath, defaultDayContext],
  );

  useEffect(() => {
    if (!open || !launchRequest || handledLaunchIdRef.current === launchRequest.id) {
      return;
    }

    handledLaunchIdRef.current = launchRequest.id;

    if (launchRequest.tab === "chat") {
      setTab("chat");
      setError("");
      setChatAnswer("");
      setProductAnswer("");
      setProductSuggestion(null);
      setChatQuestion(launchRequest.question ?? "");

      if (launchRequest.autoAsk && apiKey.trim() && launchRequest.question?.trim()) {
        void submitChatRequest(launchRequest.question, launchRequest.dayContext);
      }
      return;
    }

    if (launchRequest.tab === "product") {
      setTab("product");
      setError("");
    }
  }, [apiKey, launchRequest, open, submitChatRequest]);

  if (!open) {
    return null;
  }

  return (
    <div className="theme-overlay fixed inset-0 z-[80] flex items-end p-3">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-[#fffdfa] p-4 shadow-[0_24px_70px_rgba(35,43,53,0.24)]">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Творожок AI</div>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Помощник по продуктам и вопросам</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Выбери нужный режим: собрать карточку продукта или просто задать вопрос AI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-elevated rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            Закрыть
          </button>
        </div>

        <div className="theme-elevated mt-4 grid grid-cols-2 gap-2 rounded-[1.35rem] p-1.5">
          <button
            type="button"
            onClick={() => {
              setTab("product");
              setError("");
            }}
            className={`rounded-[1rem] px-4 py-3 text-sm font-semibold transition ${
              tab === "product" ? "theme-accent-button" : "text-slate-600"
            }`}
          >
            По продукту
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("chat");
              setError("");
            }}
            className={`rounded-[1rem] px-4 py-3 text-sm font-semibold transition ${
              tab === "chat" ? "theme-accent-button" : "text-slate-600"
            }`}
          >
            Спросить AI
          </button>
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-[rgba(122,103,88,0.12)] bg-[rgba(255,255,255,0.7)] px-4 py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">Ключ DeepSeek</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Нужен только для ответа AI. Хранится локально в этом браузере и сохраняется автоматически.
              </div>
            </div>
            <div
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                apiKey.trim() ? "theme-completed" : "theme-elevated text-slate-500"
              }`}
            >
              {apiKey.trim() ? "Ключ добавлен" : "Нужен ключ"}
            </div>
          </div>
          <input
            className={inputClass}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Вставьте свой DeepSeek API key"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">В репозиторий и GitHub Pages ключ не попадает.</div>
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

        {tab === "product" ? (
          <>
            <div className="theme-important mt-4 rounded-[1.4rem] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Режим продукта</div>
              <h4 className="mt-2 text-lg font-semibold text-slate-900">Найти данные и собрать карточку продукта</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Сначала AI ищет КБЖУ и нутриенты, потом открывает карточку-черновик. Сохранять или править ее ты решаешь сам.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["1. Продукт", "2. Данные", "3. Карточка"].map((item) => (
                  <span key={item} className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className={sectionCardClass}>
              <div className="grid gap-4">
                <label className="text-sm font-medium text-slate-600">
                  Что ищем
                  <input
                    className={inputClass}
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="Например: миндаль, чизбургер, чокопай"
                  />
                </label>

                <label className="text-sm font-medium text-slate-600">
                  Уточнение, если нужно
                  <textarea
                    value={productContext}
                    onChange={(event) => setProductContext(event.target.value)}
                    placeholder="Бренд, вкус, упаковка, вес штуки или другая полезная деталь"
                    className="theme-input mt-2 min-h-24 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-[1rem] bg-[rgba(246,240,232,0.72)] px-3.5 py-3 text-xs leading-5 text-slate-600">
                После поиска ничего не сохраняется автоматически. Сначала откроется карточка продукта, и ты сам решишь, сохранить ее или поправить.
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => void submitProductRequest()}
                  disabled={submitting || !canAskProduct}
                  className="theme-accent-button w-full rounded-[1rem] px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {submitting ? "Ищу нутриенты..." : "Найти данные и собрать карточку"}
                </button>
              </div>
            </div>

            {error ? <div className="theme-status-warning mt-4 rounded-[1.1rem] px-4 py-3 text-sm">{error}</div> : null}

            {productAnswer ? (
              <div className={sectionCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Что нашлось</div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{productAnswer}</div>
              </div>
            ) : null}

            {productSuggestion ? (
              <div className="theme-important mt-4 rounded-[1.4rem] px-4 py-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Карточка-черновик</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{productSuggestion.name}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">
                      Проверь значения и открой карточку продукта. Сохранение будет уже следующим шагом.
                    </div>
                  </div>
                  <div className="theme-completed rounded-full px-3 py-2 text-xs font-semibold">
                    {productSuggestion.unitMode === "piece" && productSuggestion.gramsPerUnit
                      ? `1 ${productSuggestion.unitLabel} ≈ ${productSuggestion.gramsPerUnit} г`
                      : "На 100 г"}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-slate-700">
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
                  onClick={() => onCreateProduct(productSuggestionToDraft(productSuggestion))}
                  className="theme-accent-button mt-4 w-full rounded-[1rem] px-5 py-3.5 text-sm font-semibold"
                >
                  Создать карточку продукта
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="theme-elevated mt-4 rounded-[1.4rem] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Режим вопроса</div>
              <h4 className="mt-2 text-lg font-semibold text-slate-900">Обычный вопрос к AI</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Здесь можно спросить, попросить подсказку или быстрый поиск. Это отдельный режим: он отвечает, но ничего не меняет в приложении сам.
              </p>
            </div>

            <div className={sectionCardClass}>
              <label className="block text-sm font-medium text-slate-600">
                Вопрос
                <textarea
                  value={chatQuestion}
                  onChange={(event) => setChatQuestion(event.target.value)}
                  placeholder="Например: чем легко добрать белок? или как добавить свой продукт?"
                  className="theme-input mt-2 min-h-28 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
                />
              </label>

              <div className="mt-4 rounded-[1rem] bg-[rgba(246,240,232,0.72)] px-3.5 py-3 text-xs leading-5 text-slate-600">
                Этот режим только информационный. AI подсказывает и ищет, но не создает продукты и не меняет данные за тебя.
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => void submitChatRequest()}
                  disabled={submitting || !canAskChat}
                  className="theme-accent-button w-full rounded-[1rem] px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {submitting ? "Думаю..." : "Спросить AI"}
                </button>
              </div>
            </div>

            {error ? <div className="theme-status-warning mt-4 rounded-[1.1rem] px-4 py-3 text-sm">{error}</div> : null}

            {chatAnswer ? (
              <div className={sectionCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ответ AI</div>
                <div className="mt-2 whitespace-pre-wrap">{chatAnswer}</div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
