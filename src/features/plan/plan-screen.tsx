"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateSwitcher } from "@/components/date-switcher";
import { EmptyState } from "@/components/empty-state";
import { MealSection } from "@/components/meal-section";
import { ProductSearchSheet } from "@/components/product-search-sheet";
import { ProfileFocusCard } from "@/components/profile-focus-card";
import { mealOrder } from "@/lib/constants";
import { clampDateKey, formatFullDate } from "@/lib/date";
import {
  getActiveProducts,
  getDaySummary,
  getItemsByMeal,
  getProductUsageCount,
  getRecentProducts,
  getSelectedUser,
} from "@/lib/selectors";
import type { MealType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function BalanceBadge({ value }: { value: number }) {
  const over = value < 0;
  return (
    <div
      className={`rounded-[1.1rem] px-3 py-2 text-sm font-semibold ${
        over
          ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          : "bg-[var(--color-mint-soft)] text-[var(--color-mint)]"
      }`}
    >
      {over ? `+${Math.abs(value)}` : value}
    </div>
  );
}

export function PlanScreen({ initialDateParam }: { initialDateParam?: string }) {
  const {
    state,
    addMealItem,
    createProduct,
    deleteMealItem,
    deleteProduct,
    setSelectedUser,
    updateMealItem,
    updateProduct,
  } = useAppStore();
  const router = useRouter();
  const currentDate = clampDateKey(initialDateParam);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMealType, setSheetMealType] = useState<MealType>("breakfast");
  const [sheetVersion, setSheetVersion] = useState(0);

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Загружаю план...</div>;
  }

  const user = getSelectedUser(state);
  if (!user) {
    return (
      <EmptyState
        title="Пока нет профиля"
        description="Сначала создайте пользователя во вкладке Profile, затем здесь появится дневной план."
      />
    );
  }

  const summary = getDaySummary(state, user, currentDate);
  const itemsByMeal = getItemsByMeal(summary);
  const activeProducts = getActiveProducts(state);
  const recentProducts = getRecentProducts(state, user.id);

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-[linear-gradient(155deg,#fffef9_0%,#f3fbff_45%,#fff1f6_100%)] px-5 py-5 shadow-[0_18px_52px_rgba(122,138,144,0.15)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Plan</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{formatFullDate(currentDate)}</h1>
          </div>
          {summary.balance ? <BalanceBadge value={summary.balance.kcal} /> : null}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[1.3rem] bg-white/82 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Норма</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{summary.target?.kcal ?? 0}</div>
          </div>
          <div className="rounded-[1.3rem] bg-white/82 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Факт</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{summary.totals.kcal}</div>
          </div>
          <div className="rounded-[1.3rem] bg-white/82 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Разница</div>
            <div className={`mt-1 text-lg font-semibold ${summary.balance && summary.balance.kcal < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-mint)]"}`}>
              {summary.balance?.kcal ?? 0}
            </div>
          </div>
        </div>
      </section>

      <ProfileFocusCard
        users={state.profiles}
        selectedUserId={user.id}
        onSelect={setSelectedUser}
        title="Активный профиль"
        description="План ниже редактируется только для выбранного профиля."
      />

      <DateSwitcher date={currentDate} onChange={(nextDate) => router.replace(`/plan?date=${nextDate}`, { scroll: false })} />

      {mealOrder.map((mealType) => (
        <MealSection
          key={mealType}
          mealType={mealType}
          rows={itemsByMeal[mealType]}
          onAdd={() => {
            setSheetMealType(mealType);
            setSheetVersion((value) => value + 1);
            setSheetOpen(true);
          }}
          onUpdateQuantity={(itemId, payload) => updateMealItem({ itemId, ...payload })}
          onDelete={(itemId) => deleteMealItem(itemId)}
        />
      ))}

      {!summary.items.length ? (
        <EmptyState
          title="День пока пустой"
          description="Заполните хотя бы один прием пищи, и здесь сразу появится полный итог по КБЖУ."
        />
      ) : null}

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Итого за день</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{summary.totals.kcal} ккал</h2>
          </div>
          {summary.balance ? <BalanceBadge value={summary.balance.kcal} /> : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Норма</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{summary.target?.kcal ?? 0}</div>
          </div>
          <div className="rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Факт</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{summary.totals.kcal}</div>
          </div>
          <div className="rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Разница</div>
            <div className={`mt-2 text-xl font-semibold ${summary.balance && summary.balance.kcal < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-mint)]"}`}>
              {summary.balance?.kcal ?? 0}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Белки</div>
            <div className={`mt-2 font-semibold ${(summary.balance?.protein ?? 0) < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-mint)]"}`}>
              {summary.balance?.protein ?? 0} г
            </div>
          </div>
          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Жиры</div>
            <div className={`mt-2 font-semibold ${(summary.balance?.fat ?? 0) < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-mint)]"}`}>
              {summary.balance?.fat ?? 0} г
            </div>
          </div>
          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Углеводы</div>
            <div className={`mt-2 font-semibold ${(summary.balance?.carbs ?? 0) < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-mint)]"}`}>
              {summary.balance?.carbs ?? 0} г
            </div>
          </div>
        </div>
      </section>

      <ProductSearchSheet
        key={`${sheetMealType}-${sheetVersion}`}
        open={sheetOpen}
        products={activeProducts}
        recentProducts={recentProducts}
        initialMealType={sheetMealType}
        onClose={() => setSheetOpen(false)}
        onSubmit={(payload) => addMealItem({ userId: user.id, date: currentDate, ...payload })}
        onCreateProduct={(draft) => createProduct(draft)}
        onUpdateProduct={(productId, draft) => updateProduct(productId, draft)}
        onDeleteProduct={(productId) => deleteProduct(productId)}
        getProductUsageCount={(productId) => getProductUsageCount(state, productId)}
      />
    </div>
  );
}
