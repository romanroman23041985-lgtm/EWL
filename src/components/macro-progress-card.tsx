type MacroProgressCardProps = {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  tint?: "mint" | "pink" | "gold";
};

const tintStyles = {
  mint: {
    track: "bg-[var(--color-mint-soft)]",
    fill: "bg-[var(--color-mint)]",
  },
  pink: {
    track: "bg-[var(--color-accent-soft)]",
    fill: "bg-[var(--color-accent)]",
  },
  gold: {
    track: "bg-[#fff0dd]",
    fill: "bg-[var(--color-warning)]",
  },
};

export function MacroProgressCard({
  label,
  consumed,
  target,
  unit,
  tint = "mint",
}: MacroProgressCardProps) {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const delta = Math.round((target - consumed) * 10) / 10;

  return (
    <div className="app-card rounded-[1.75rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {consumed}
            <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>
          </p>
        </div>
        <div className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {target}
          {unit}
        </div>
      </div>
      <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${tintStyles[tint].track}`}>
        <div
          className={`h-full rounded-full ${tintStyles[tint].fill}`}
          style={{ width: `${Math.max(progress * 100, consumed > 0 ? 8 : 0)}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {delta >= 0 ? `Осталось ${delta}${unit}` : `Превышение ${Math.abs(delta)}${unit}`}
      </p>
    </div>
  );
}
