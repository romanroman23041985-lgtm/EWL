import { mealLabels, mealOrder } from "@/lib/constants";
import { getItemsByMeal, getMealTotals } from "@/lib/selectors";
import type { DaySummary } from "@/lib/types";

export function DaySummaryCard({ summary }: { summary: DaySummary }) {
  const itemsByMeal = getItemsByMeal(summary);

  return (
    <div className="app-card rounded-[2rem] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Сегодняшний итог</p>
          <p className="mt-1 font-display text-3xl font-semibold text-slate-900">{summary.totals.kcal} ккал</p>
        </div>
        {summary.balance ? (
          <div
            className={`rounded-full px-3 py-2 text-sm font-semibold ${
              summary.balance.kcal < 0
                ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "bg-[var(--color-mint-soft)] text-[var(--color-mint)]"
            }`}
          >
            {summary.balance.kcal < 0 ? `+${Math.abs(summary.balance.kcal)}` : summary.balance.kcal} ккал
          </div>
        ) : null}
      </div>
      <div className="mt-5 grid gap-3">
        {mealOrder.map((mealType) => {
          const rows = itemsByMeal[mealType];
          const totals = getMealTotals(rows);
          return (
            <div key={mealType} className="flex items-center justify-between rounded-[1.4rem] bg-white/75 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{mealLabels[mealType]}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {rows.length ? `${rows.length} поз. • ${totals.kcal} ккал` : "Пока пусто"}
                </p>
              </div>
              <div className="text-right text-xs leading-5 text-slate-500">
                <div>Б {totals.protein}</div>
                <div>Ж {totals.fat}</div>
                <div>У {totals.carbs}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
