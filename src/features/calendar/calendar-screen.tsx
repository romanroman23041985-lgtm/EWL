"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { MonthCalendar } from "@/components/month-calendar";
import { ProfileFocusCard } from "@/components/profile-focus-card";
import { getMonthStats, getMonthSummaryMap, getSelectedUser } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";

export function CalendarScreen() {
  const { state, setSelectedUser } = useAppStore();
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>();

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Собираю календарь...</div>;
  }

  const user = getSelectedUser(state);
  if (!user) {
    return (
      <EmptyState
        title="Календарь появится после создания профиля"
        description="Как только у пользователя будут дни с приемами пищи, здесь появится история и статистика."
      />
    );
  }

  const summaryMap = getMonthSummaryMap(state, user, monthDate);
  const stats = getMonthStats(state, user, monthDate);
  const monthlyBalancePositive = stats.totalBalanceKcal >= 0;

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-[linear-gradient(150deg,#fffef9_0%,#eefbf7_50%,#fff2f6_100%)] px-5 py-5 shadow-[0_18px_50px_rgba(123,139,146,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Calendar</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">История по дням</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Быстро находите заполненные дни, превышения и открывайте нужную дату в плане.
        </p>
      </section>

      <ProfileFocusCard
        users={state.profiles}
        selectedUserId={user.id}
        onSelect={setSelectedUser}
        title="Профиль календаря"
        description="Календарь и статистика сейчас показаны только для одного активного профиля."
      />

      <MonthCalendar
        monthDate={monthDate}
        selectedDate={selectedDate}
        summaryMap={summaryMap}
        onChangeMonth={(amount) => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + amount, 1))}
        onSelectDate={(date) => {
          setSelectedDate(date);
          router.push(`/plan?date=${date}`);
        }}
      />

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Статистика месяца</h2>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-white px-3 py-2">Нет данных</span>
            <span className="rounded-full bg-[var(--color-mint-soft)] px-3 py-2 text-[var(--color-mint)]">Есть записи</span>
            <span className="rounded-full bg-[var(--color-danger-soft)] px-3 py-2 text-[var(--color-danger)]">Превышение</span>
            <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-2 text-[var(--color-accent)]">Выбранный день</span>
          </div>
        </div>

        {stats.daysLogged ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[1.35rem] bg-white px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Заполнено дней</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.daysLogged}</div>
            </div>
            <div className="rounded-[1.35rem] bg-white px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Средние ккал</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.average.kcal}</div>
            </div>
            <div className="rounded-[1.35rem] bg-white px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Цель за месяц</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.totalTargetKcal}</div>
            </div>
            <div className="rounded-[1.35rem] bg-white px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Факт за месяц</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.totalActualKcal}</div>
            </div>
            <div className="rounded-[1.35rem] bg-[var(--color-danger-soft)] px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-danger)]/70">Дней выше нормы</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--color-danger)]">{stats.daysAbove}</div>
            </div>
            <div className="rounded-[1.35rem] bg-[var(--color-mint-soft)] px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-mint)]/70">Дней в норме</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--color-mint)]">{stats.daysWithin}</div>
            </div>
            <div
              className={`col-span-2 rounded-[1.35rem] px-4 py-4 text-sm ${
                monthlyBalancePositive ? "bg-[var(--color-mint-soft)] text-slate-700" : "bg-[var(--color-danger-soft)] text-slate-700"
              }`}
            >
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Итог месяца</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {monthlyBalancePositive
                  ? `Вы недобрали ${stats.totalBalanceKcal} ккал относительно цели месяца`
                  : `Вы превысили месячную цель на ${Math.abs(stats.totalBalanceKcal)} ккал`}
              </div>
              <p className="mt-2 leading-6">
                {monthlyBalancePositive
                  ? "Темп идет мягко и в рамках плана. Продолжайте так же спокойно."
                  : "Ничего критичного: просто в следующем месяце можно держаться чуть ближе к дневной цели."}
              </p>
            </div>
            <div className="col-span-2 rounded-[1.35rem] bg-white px-4 py-4 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Средние Б/Ж/У</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-[1rem] bg-slate-50 px-3 py-3">Б {stats.average.protein}</div>
                <div className="rounded-[1rem] bg-slate-50 px-3 py-3">Ж {stats.average.fat}</div>
                <div className="rounded-[1rem] bg-slate-50 px-3 py-3">У {stats.average.carbs}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="В этом месяце еще нет данных"
              description="Как только появятся заполненные дни, здесь соберется простая месячная статистика."
            />
          </div>
        )}
      </section>
    </div>
  );
}
