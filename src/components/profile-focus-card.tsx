"use client";

import { useState } from "react";
import { UserSwitcher } from "@/components/user-switcher";
import { calculateTargets } from "@/lib/macros";
import type { UserProfile } from "@/lib/types";

export function ProfileFocusCard({
  users,
  selectedUserId,
  onSelect,
  title = "Текущий профиль",
  description = "Все расчеты на этом экране считаются для одного активного профиля.",
}: {
  users: UserProfile[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
  title?: string;
  description?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  if (!selectedUser) {
    return null;
  }

  const targets = calculateTargets(selectedUser);
  const canSwitch = users.length > 1;

  return (
    <section className="app-card rounded-[1.9rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <h2 className="mt-2 truncate text-xl font-semibold text-slate-900">{selectedUser.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {canSwitch ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-11 rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)]"
          >
            {expanded ? "Скрыть" : "Сменить"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-[1.25rem] bg-white px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Вес</div>
          <div className="mt-1 text-base font-semibold text-slate-900">
            {selectedUser.weightKg} → {selectedUser.goalWeightKg ?? selectedUser.weightKg} кг
          </div>
        </div>
        <div className="rounded-[1.25rem] bg-white px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Норма</div>
          <div className="mt-1 text-base font-semibold text-slate-900">{targets.kcal} ккал</div>
        </div>
        <div className="rounded-[1.25rem] bg-white px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Б/Ж/У</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {targets.protein} / {targets.fat} / {targets.carbs}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4">
          <UserSwitcher users={users} selectedUserId={selectedUserId} onSelect={onSelect} />
        </div>
      ) : null}
    </section>
  );
}
