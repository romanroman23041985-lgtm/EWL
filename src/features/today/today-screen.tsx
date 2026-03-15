"use client";

import Link from "next/link";
import { useState } from "react";
import { DaySummaryCard } from "@/components/day-summary-card";
import { EmptyState } from "@/components/empty-state";
import { MacroProgressCard } from "@/components/macro-progress-card";
import { ProductSearchSheet } from "@/components/product-search-sheet";
import { UserSwitcher } from "@/components/user-switcher";
import { mealLabels, mealOrder } from "@/lib/constants";
import { formatFullDate, getTodayDate } from "@/lib/date";
import {
  getActiveProducts,
  getDaySummary,
  getProductUsageCount,
  getRecentProducts,
  getSelectedUser,
} from "@/lib/selectors";
import type { MealType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

export function TodayScreen() {
  const {
    state,
    addMealItem,
    createProduct,
    deleteProduct,
    setSelectedUser,
    updateProduct,
  } = useAppStore();
  const [sheetMealType, setSheetMealType] = useState<MealType>("breakfast");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetVersion, setSheetVersion] = useState(0);

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Загружаю данные...</div>;
  }

  const user = getSelectedUser(state);
  const today = getTodayDate();
  const summary = getDaySummary(state, user, today);

  if (!user) {
    return (
      <EmptyState
        title="Создайте первый профиль"
        description="Добавьте пользователя в разделе Profile, и приложение сразу рассчитает дневную норму."
      />
    );
  }

  const activeProducts = getActiveProducts(state);
  const recentProducts = getRecentProducts(state, user.id);
  const kcalBalance = summary.balance?.kcal ?? 0;
  const kcalOver = kcalBalance < 0;

  return (
    <div className="space-y-4">
      <section className="rounded-[2.3rem] bg-[linear-gradient(160deg,#fffdf8_0%,#f1fdf6_52%,#ffeef4_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(129,143,151,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Today</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl font-semibold text-slate-900">{summary.totals.kcal}</h1>
            <p className="mt-2 text-sm text-slate-500">{formatFullDate(today)}</p>
          </div>
          <div
            className={`rounded-[1.5rem] px-4 py-3 text-right ${
              kcalOver
                ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "bg-[var(--color-mint-soft)] text-[var(--color-mint)]"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.16em]">
              {kcalOver ? "Превышение" : "Осталось"}
            </div>
            <div className="mt-1 text-2xl font-semibold">{kcalOver ? `+${Math.abs(kcalBalance)}` : kcalBalance}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[1.35rem] bg-white/82 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Сегодня съедено</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{summary.totals.kcal}</div>
          </div>
          <div className="rounded-[1.35rem] bg-white/82 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Осталось</div>
            <div className={`mt-2 text-xl font-semibold ${kcalOver ? "text-[var(--color-danger)]" : "text-[var(--color-mint)]"}`}>
              {kcalOver ? `+${Math.abs(kcalBalance)}` : kcalBalance}
            </div>
          </div>
          <div className="rounded-[1.35rem] bg-white/82 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Цель</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{summary.target?.kcal ?? 0}</div>
          </div>
        </div>
      </section>

      <UserSwitcher users={state.profiles} selectedUserId={user.id} onSelect={setSelectedUser} />

      <section className="grid grid-cols-2 gap-3">
        <MacroProgressCard label="Калории" consumed={summary.totals.kcal} target={summary.target?.kcal ?? 0} unit="" tint="pink" />
        <MacroProgressCard label="Белки" consumed={summary.totals.protein} target={summary.target?.protein ?? 0} unit="г" tint="mint" />
        <MacroProgressCard label="Жиры" consumed={summary.totals.fat} target={summary.target?.fat ?? 0} unit="г" tint="gold" />
        <MacroProgressCard label="Углеводы" consumed={summary.totals.carbs} target={summary.target?.carbs ?? 0} unit="г" tint="mint" />
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Быстро добавить еду</h2>
            <p className="mt-1 text-sm text-slate-500">Нажмите на нужный прием пищи и добавьте продукт без лишних переходов.</p>
          </div>
          <Link
            href={`/plan?date=${today}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            К плану
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {mealOrder.map((mealType) => (
            <button
              key={mealType}
              type="button"
              onClick={() => {
                setSheetMealType(mealType);
                setSheetVersion((value) => value + 1);
                setSheetOpen(true);
              }}
              className="rounded-[1.5rem] bg-white px-4 py-4 text-left shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900">{mealLabels[mealType]}</p>
              <p className="mt-1 text-xs text-slate-500">Добавить в {mealLabels[mealType].toLowerCase()}</p>
            </button>
          ))}
        </div>
      </section>

      {!summary.items.length ? (
        <EmptyState
          title="Сегодня еще нет записей"
          description="Добавьте первый продукт, и здесь сразу появятся итог за день, прогресс по КБЖУ и баланс."
          action={
            <button
              type="button"
              onClick={() => {
                setSheetMealType("breakfast");
                setSheetVersion((value) => value + 1);
                setSheetOpen(true);
              }}
              className="rounded-[1rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Добавить первый продукт
            </button>
          }
        />
      ) : (
        <DaySummaryCard summary={summary} />
      )}

      <ProductSearchSheet
        key={`${sheetMealType}-${sheetVersion}`}
        open={sheetOpen}
        products={activeProducts}
        recentProducts={recentProducts}
        initialMealType={sheetMealType}
        onClose={() => setSheetOpen(false)}
        onSubmit={({ mealType, productId, grams }) =>
          addMealItem({ userId: user.id, date: today, mealType, productId, grams })
        }
        onCreateProduct={(draft) => createProduct(draft)}
        onUpdateProduct={(productId, draft) => updateProduct(productId, draft)}
        onDeleteProduct={(productId) => deleteProduct(productId)}
        getProductUsageCount={(productId) => getProductUsageCount(state, productId)}
      />
    </div>
  );
}
