type DayState = {
  hasItems: boolean;
  isOver: boolean;
};

export function MonthCalendar({
  monthDate,
  selectedDate,
  summaryMap,
  onSelectDate,
  onChangeMonth,
}: {
  monthDate: Date;
  selectedDate?: string;
  summaryMap: Map<string, DayState>;
  onSelectDate: (date: string) => void;
  onChangeMonth: (amount: number) => void;
}) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const offset = (start.getDay() + 6) % 7;
  const totalCells = Math.ceil((offset + end.getDate()) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(start);
    date.setDate(1 - offset + index);
    return {
      day: date.getDate(),
      dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });

  return (
    <div className="app-card rounded-[2rem] p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onChangeMonth(-1)}
          className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Назад
        </button>
        <h3 className="text-lg font-semibold text-slate-900">
          {monthDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
        </h3>
        <button
          type="button"
          onClick={() => onChangeMonth(1)}
          className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Вперёд
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {cells.map((cell) => {
          const state = summaryMap.get(cell.dateKey);
          const selected = selectedDate === cell.dateKey;
          const baseClass = !state?.hasItems
            ? "bg-white text-slate-400"
            : state.isOver
              ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
              : "bg-[var(--color-mint-soft)] text-[var(--color-mint)]";

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(cell.dateKey)}
              className={`relative aspect-square rounded-[1rem] text-sm font-semibold transition ${
                cell.inCurrentMonth ? baseClass : "bg-white/55 text-slate-300"
              } ${selected ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[#f8f7f1]" : ""}`}
            >
              <span className={selected ? "font-bold" : ""}>{cell.day}</span>
              {!state?.hasItems && cell.inCurrentMonth ? (
                <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-200" />
              ) : null}
              {state?.hasItems ? (
                <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-current" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
