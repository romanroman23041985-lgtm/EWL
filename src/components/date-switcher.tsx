import { addDays, formatShortDate, getTodayDate } from "@/lib/date";

export function DateSwitcher({
  date,
  onChange,
}: {
  date: string;
  onChange: (nextDate: string) => void;
}) {
  const today = getTodayDate();

  return (
    <div className="app-card rounded-[1.8rem] p-4">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onChange(addDays(date, -1))}
          className="rounded-[1.15rem] bg-white px-3 py-3 text-sm font-semibold text-slate-700"
        >
          Вчера
        </button>
        <button
          type="button"
          onClick={() => onChange(today)}
          className="rounded-[1.15rem] bg-[var(--color-mint-soft)] px-3 py-3 text-sm font-semibold text-[var(--color-mint)]"
        >
          Сегодня
        </button>
        <button
          type="button"
          onClick={() => onChange(addDays(date, 1))}
          className="rounded-[1.15rem] bg-white px-3 py-3 text-sm font-semibold text-slate-700"
        >
          Завтра
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-[1.15rem] bg-white px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Выбранная дата</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatShortDate(date)}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-full border border-[var(--color-outline)] px-3 py-2 text-sm outline-none"
        />
      </div>
    </div>
  );
}
