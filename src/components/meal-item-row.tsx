"use client";

import { useState } from "react";
import { ProductAvatar } from "@/components/product-avatar";
import type { DayMealRow } from "@/lib/types";

export function MealItemRow({
  row,
  onUpdateGrams,
  onDelete,
}: {
  row: DayMealRow;
  onUpdateGrams: (grams: number) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(String(row.item.grams));

  const commitGrams = (value: string) => {
    const next = Number(value.replace(",", "."));
    if (!Number.isFinite(next) || next <= 0) {
      setDraft(String(row.item.grams));
      return;
    }

    const normalized = Math.round(next);
    setDraft(String(normalized));
    if (normalized !== row.item.grams) {
      onUpdateGrams(normalized);
    }
  };

  const stepChange = (step: number) => {
    const nextValue = Math.max(1, row.item.grams + step);
    setDraft(String(nextValue));
    onUpdateGrams(nextValue);
  };

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
            <div className="rounded-[1rem] bg-slate-50 px-3 py-2">{row.item.grams} г</div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepChange(-10)}
              className="h-11 rounded-[1rem] bg-slate-100 px-3 text-sm font-semibold text-slate-700"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => stepChange(-5)}
              className="h-11 rounded-[1rem] bg-slate-100 px-3 text-sm font-semibold text-slate-700"
            >
              -5
            </button>
            <input
              key={`${row.item.id}-${row.item.grams}`}
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => commitGrams(draft)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-[1rem] border border-[var(--color-outline)] bg-white px-3 text-center text-base font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => stepChange(5)}
              className="h-11 rounded-[1rem] bg-[var(--color-mint-soft)] px-3 text-sm font-semibold text-[var(--color-mint)]"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => stepChange(10)}
              className="h-11 rounded-[1rem] bg-[var(--color-mint-soft)] px-3 text-sm font-semibold text-[var(--color-mint)]"
            >
              +10
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
