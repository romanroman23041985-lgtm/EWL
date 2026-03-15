import { MealItemRow } from "@/components/meal-item-row";
import { mealLabels } from "@/lib/constants";
import { getMealTotals } from "@/lib/selectors";
import type { DayMealRow, MealType } from "@/lib/types";

export function MealSection({
  mealType,
  rows,
  onAdd,
  onUpdateQuantity,
  onDelete,
}: {
  mealType: MealType;
  rows: DayMealRow[];
  onAdd: () => void;
  onUpdateQuantity: (
    itemId: string,
    payload: { grams: number; quantityMode?: "grams" | "piece"; servings?: number | null },
  ) => void;
  onDelete: (itemId: string) => void;
}) {
  const totals = getMealTotals(rows);

  return (
    <section className="app-card rounded-[2rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{mealLabels[mealType]}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700">
              {rows.length ? `${rows.length} поз.` : "Пусто"}
            </span>
            <span className="rounded-full bg-[var(--color-mint-soft)] px-3 py-1.5 font-semibold text-[var(--color-mint)]">
              {totals.kcal} ккал
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">Б {totals.protein}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">Ж {totals.fat}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">У {totals.carbs}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(243,124,165,0.28)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-base">+</span>
          Добавить
        </button>
      </div>

      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <MealItemRow
              key={`${row.item.id}-${row.item.grams}-${row.item.servings ?? "g"}`}
              row={row}
              onUpdateQuantity={(payload) => onUpdateQuantity(row.item.id, payload)}
              onDelete={() => onDelete(row.item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.5rem] border border-dashed border-[var(--color-outline)] bg-white/60 px-4 py-5 text-sm leading-6 text-slate-500">
          Пока пусто. Нажмите «Добавить», чтобы быстро занести продукт прямо в этот прием пищи.
        </div>
      )}
    </section>
  );
}
