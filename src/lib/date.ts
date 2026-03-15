const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  weekday: "long",
});
const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});
const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});

export function padDateUnit(value: number) {
  return value.toString().padStart(2, "0");
}

export function dateKeyFromParts(year: number, monthIndex: number, day: number) {
  return `${year}-${padDateUnit(monthIndex + 1)}-${padDateUnit(day)}`;
}

export function getTodayDate() {
  const today = new Date();
  return dateKeyFromParts(today.getFullYear(), today.getMonth(), today.getDate());
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return dateKeyFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatFullDate(dateKey: string) {
  const text = fullDateFormatter.format(parseDateKey(dateKey));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatShortDate(dateKey: string) {
  return shortDateFormatter.format(parseDateKey(dateKey));
}

export function formatMonthLabel(date: Date) {
  const text = monthFormatter.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isToday(dateKey: string) {
  return dateKey === getTodayDate();
}

export function clampDateKey(dateKey?: string | null) {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return getTodayDate();
  }

  return dateKey;
}

export function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getMonthGrid(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startOffset = (start.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + end.getDate()) / 7) * 7;
  const grid: Array<{
    dateKey: string;
    day: number;
    inCurrentMonth: boolean;
    weekdayLabel: string;
  }> = [];

  for (let index = 0; index < totalCells; index += 1) {
    const date = new Date(start);
    date.setDate(1 - startOffset + index);
    grid.push({
      dateKey: dateKeyFromParts(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
      weekdayLabel: weekdayFormatter.format(date),
    });
  }

  return grid;
}
