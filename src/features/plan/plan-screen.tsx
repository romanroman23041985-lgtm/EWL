"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { DayAiAssistantCard } from "@/components/day-ai-assistant-card";
import { MealSection } from "@/components/meal-section";
import { MicronutrientBalanceCard } from "@/components/micronutrient-balance-card";
import { ProductSearchSheet } from "@/components/product-search-sheet";
import { formatFullDate, getTodayDate } from "@/lib/date";
import {
  getActiveProducts,
  getDaySuggestion,
  getDaySummary,
  getMealSections,
  getProductUsageCount,
  getRecentProducts,
  getSelectedUser,
} from "@/lib/selectors";
import type { MealType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function BalanceBadge({ value }: { value: number }) {
  const over = value < 0;
  return (
        <div className={`rounded-[1.1rem] px-3 py-2 text-sm font-semibold ${over ? "theme-status-warning" : "theme-important"}`}>
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
    updateMealItem,
    updateProduct,
  } = useAppStore();
  const currentDate = initialDateParam ?? getTodayDate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMealType, setSheetMealType] = useState<MealType>("breakfast");
  const [sheetMealLabel, setSheetMealLabel] = useState("");
  const [sheetVersion, setSheetVersion] = useState(0);
  const [newMealLabel, setNewMealLabel] = useState("");

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Загружаю день...</div>;
  }

  const user = getSelectedUser(state);
  if (!user) {
    return (
      <EmptyState
        title="Сначала создайте профиль"
        description="На первой вкладке создайте профиль, и здесь появится план питания на день."
      />
    );
  }

  const summary = getDaySummary(state, user, currentDate);
  const sections = getMealSections(summary);
  const activeProducts = getActiveProducts(state);
  const recentProducts = getRecentProducts(state, user.id);
  const daySuggestion = getDaySuggestion(summary, activeProducts);
  const dinnerSection = sections.find((section) => section.mealType === "dinner");

  const openMealSheet = (mealType: MealType, mealLabel = "") => {
    setSheetMealType(mealType);
    setSheetMealLabel(mealLabel);
    setSheetVersion((value) => value + 1);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <section className="theme-panel rounded-[2rem] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">День</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{formatFullDate(currentDate)}</h1>
          </div>
          {summary.balance ? <BalanceBadge value={summary.balance.kcal} /> : null}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="theme-elevated rounded-[1.3rem] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Цель</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{summary.target?.kcal ?? 0}</div>
          </div>
          <div className="theme-elevated rounded-[1.3rem] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Съедено</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{summary.totals.kcal}</div>
          </div>
          <div className="theme-important rounded-[1.3rem] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Осталось</div>
            <div
              className={`mt-1 text-lg font-semibold ${
                summary.balance && summary.balance.kcal < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-important-text)]"
              }`}
            >
              {summary.balance?.kcal ?? 0}
            </div>
          </div>
        </div>

        {daySuggestion ? (
          <div className="theme-important mt-4 rounded-[1.35rem] px-4 py-4">
            <div className="text-sm font-semibold text-slate-900">{daySuggestion.title}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">{daySuggestion.description}</div>
          </div>
        ) : null}
      </section>

      {sections.map((section) => (
        <MealSection
          key={section.id}
          title={section.label}
          rows={section.rows}
          onAdd={() => openMealSheet(section.mealType, section.mealType === "custom" ? section.label : "")}
          onUpdateQuantity={(itemId, payload) => updateMealItem({ itemId, ...payload })}
          onDelete={(itemId) => deleteMealItem(itemId)}
        />
      ))}

      <MicronutrientBalanceCard
        title="Нутриенты за день"
        description="Показываю, что еще не добрали по клетчатке и основным микроэлементам."
        target={summary.target}
        actual={summary.totals}
      />

      <DayAiAssistantCard
        summary={summary}
        currentPath="/plan"
        dinnerClosed={Boolean(dinnerSection?.rows.length)}
      />

      <section className="app-card rounded-[2rem] p-5">
        <h2 className="text-lg font-semibold text-slate-900">Добавить свой прием пищи</h2>
        <p className="mt-1 text-sm text-slate-500">Например: предужин, второй перекус или поздний ужин.</p>
        <div className="mt-4 flex items-center gap-3">
          <input
            value={newMealLabel}
            onChange={(event) => setNewMealLabel(event.target.value)}
            placeholder="Название приема пищи"
            className="theme-input h-12 min-w-0 flex-1 rounded-[1rem] border border-[var(--color-outline)] px-4 outline-none"
          />
          <button
            type="button"
            disabled={newMealLabel.trim().length < 2}
            onClick={() => {
              openMealSheet("custom", newMealLabel.trim());
              setNewMealLabel("");
            }}
            className="theme-accent-button rounded-[1rem] px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            +
          </button>
        </div>
      </section>

      {!summary.items.length ? (
        <EmptyState
          title="День пока пустой"
          description="Добавьте завтрак, обед, перекус, ужин или свой прием пищи."
        />
      ) : null}

      <ProductSearchSheet
        key={`${sheetMealType}-${sheetMealLabel}-${sheetVersion}`}
        open={sheetOpen}
        products={activeProducts}
        recentProducts={recentProducts}
        initialMealType={sheetMealType}
        initialMealLabel={sheetMealLabel}
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
