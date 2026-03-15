"use client";

import { useMemo, useState } from "react";
import { getAutoKcalFromDraft, toProductDraft, validateProductDraft } from "@/lib/products";
import type { Product, ProductDraft } from "@/lib/types";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

export function ProductFormSheet({
  mode,
  product,
  usageCount = 0,
  onClose,
  onSave,
  onDelete,
}: {
  mode: "create" | "edit";
  product?: Product;
  usageCount?: number;
  onClose: () => void;
  onSave: (draft: ProductDraft) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<ProductDraft>(() => toProductDraft(product));
  const validation = useMemo(() => validateProductDraft(draft), [draft]);
  const autoKcal = useMemo(() => getAutoKcalFromDraft(draft), [draft]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-slate-900/40 p-3">
      <div className="w-full max-w-md rounded-[2rem] bg-[#fffdfa] p-4 shadow-[0_24px_70px_rgba(35,43,53,0.24)]">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {mode === "create" ? "Новый продукт" : "Редактировать продукт"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {mode === "create"
                ? "Добавьте свой продукт, и он сразу появится в поиске."
                : "Меняйте только пользовательские продукты. История старых дней сохранится."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
          >
            Закрыть
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          <label className="text-sm font-medium text-slate-600">
            Название
            <input
              className={inputClass}
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Например, сырники"
            />
          </label>

          <label className="text-sm font-medium text-slate-600">
            Иконка
            <input
              className={inputClass}
              value={draft.icon}
              onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
              placeholder="Опционально: 🧀"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-slate-600">
              Белки / 100 г
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.1"
                value={draft.proteinPer100}
                onChange={(event) => setDraft({ ...draft, proteinPer100: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Жиры / 100 г
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.1"
                value={draft.fatPer100}
                onChange={(event) => setDraft({ ...draft, fatPer100: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Углеводы / 100 г
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.1"
                value={draft.carbsPer100}
                onChange={(event) => setDraft({ ...draft, carbsPer100: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Ккал / 100 г
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                value={draft.kcalPer100}
                onChange={(event) => setDraft({ ...draft, kcalPer100: event.target.value })}
                placeholder={`Авто: ${autoKcal}`}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-[1.25rem] bg-[var(--color-mint-soft)] px-4 py-3 text-sm text-slate-600">
          <div className="font-semibold text-slate-800">Калории</div>
          <div className="mt-1">
            {draft.kcalPer100.trim() ? `Использую ${draft.kcalPer100} ккал на 100 г.` : `Автоматически рассчитаю ${autoKcal} ккал по формуле 4/9/4.`}
          </div>
        </div>

        {!validation.valid ? (
          <div className="mt-4 rounded-[1.1rem] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {validation.message}
          </div>
        ) : null}

        {mode === "edit" && onDelete ? (
          <div className="mt-4 rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
            {usageCount > 0
              ? "Если удалить этот продукт, он станет архивным и останется в старых записях."
              : "Этот продукт пока не использовался, поэтому его можно удалить полностью."}
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-[1rem] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)]"
            >
              Удалить
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={!validation.valid}
            className="ml-auto rounded-[1rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(243,124,165,0.3)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mode === "create" ? "Сохранить продукт" : "Сохранить изменения"}
          </button>
        </div>
      </div>
    </div>
  );
}
