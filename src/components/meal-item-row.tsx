"use client";

import { useState } from "react";
import { ProductAvatar } from "@/components/product-avatar";
import {
  formatAmountValue,
  formatMealItemQuantity,
  getMealItemAmount,
  getProductQuantityMode,
  toMealItemQuantity,
} from "@/lib/products";
import type { DayMealRow } from "@/lib/types";

export function MealItemRow({
  row,
  onUpdateQuantity,
  onDelete,
}: {
  row: DayMealRow;
  onUpdateQuantity: (payload: { grams: number; quantityMode?: "grams" | "piece"; servings?: number | null }) => void;
  onDelete: () => void;
}) {
  const mode = getProductQuantityMode(row.product);
  const currentAmount = getMealItemAmount(row.product, row.item);
  const [draft, setDraft] = useState(formatAmountValue(currentAmount));

  const commitAmount = (value: string) => {
    const next = Number(value.replace(",", "."));
    if (!Number.isFinite(next) || next <= 0) {
      setDraft(formatAmountValue(currentAmount));
      return;
    }

    const normalized = mode === "piece" ? Math.round(next * 10) / 10 : Math.round(next);
    const nextQuantity = toMealItemQuantity(row.product, normalized);
    setDraft(formatAmountValue(normalized));

    if (
      nextQuantity.grams !== row.item.grams ||
      nextQuantity.quantityMode !== (row.item.quantityMode ?? "grams") ||
      (nextQuantity.servings ?? null) !== (row.item.servings ?? null)
    ) {
      onUpdateQuantity(nextQuantity);
    }
  };

  const stepChange = (step: number) => {
    const draftValue = Number(draft.replace(",", "."));
    const baseValue = Number.isFinite(draftValue) && draftValue > 0 ? draftValue : currentAmount;
    const nextValue = Math.max(0.1, Math.round((baseValue + step) * 10) / 10);
    setDraft(formatAmountValue(nextValue));
    onUpdateQuantity(toMealItemQuantity(row.product, nextValue));
  };

  const steps = mode === "piece" ? [-1, -0.5, 0.5, 1] : [-10, -5, 5, 10];

  return (
    <div className="rounded-[1.5rem] bg-white/88 p-4">
      <div className="flex items-start gap-3">
        <ProductAvatar icon={row.product.icon} name={row.product.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-slate-900">{row.product.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
                {row.product.isCustom ? (
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-1 text-[var(--color-accent)]">
                    Свой продукт
                  </span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-2 py-1">{row.nutrition.kcal} ккал</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full bg-[var(--color-danger-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)]"
            >
              Удалить
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div className="rounded-[1rem] bg-slate-50 px-3 py-2">Б {row.nutrition.protein}</div>
            <div className="rounded-[1rem] bg-slate-50 px-3 py-2">Ж {row.nutrition.fat}</div>
            <div className="rounded-[1rem] bg-slate-50 px-3 py-2">У {row.nutrition.carbs}</div>
            <div className="rounded-[1rem] bg-slate-50 px-3 py-2">{formatMealItemQuantity(row.product, row.item)}</div>
          </div>

          <div className="mt-3 grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-2">
            <button
              type="button"
              onClick={() => stepChange(steps[0])}
              className="h-11 rounded-[1rem] bg-slate-100 px-3 text-sm font-semibold text-slate-700"
            >
              {steps[0]}
            </button>
            <button
              type="button"
              onClick={() => stepChange(steps[1])}
              className="h-11 rounded-[1rem] bg-slate-100 px-3 text-sm font-semibold text-slate-700"
            >
              {steps[1]}
            </button>
            <input
              key={`${row.item.id}-${row.item.grams}-${row.item.servings ?? "g"}`}
              type="number"
              min="0.1"
              step={mode === "piece" ? "0.5" : "1"}
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => commitAmount(draft)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              className="h-11 min-w-0 rounded-[1rem] border border-[var(--color-outline)] bg-white px-3 text-center text-base font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => stepChange(steps[2])}
              className="h-11 rounded-[1rem] bg-[var(--color-mint-soft)] px-3 text-sm font-semibold text-[var(--color-mint)]"
            >
              +{steps[2]}
            </button>
            <button
              type="button"
              onClick={() => stepChange(steps[3])}
              className="h-11 rounded-[1rem] bg-[var(--color-mint-soft)] px-3 text-sm font-semibold text-[var(--color-mint)]"
            >
              +{steps[3]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
