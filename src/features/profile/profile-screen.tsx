"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { UserSwitcher } from "@/components/user-switcher";
import { calculateTargets } from "@/lib/macros";
import { getSelectedUser } from "@/lib/selectors";
import { useAppStore, sanitizeNumber } from "@/store/app-store";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

export function ProfileScreen() {
  const { state, createProfile, deleteProfile, setSelectedUser, updateProfile } = useAppStore();
  const [draft, setDraft] = useState<{
    name: string;
    sex: "female" | "male";
    weightKg: string;
    proteinPerKg: string;
    fatPerKg: string;
    carbsPerKg: string;
  }>({
    name: "",
    sex: "female",
    weightKg: "60",
    proteinPerKg: "1.8",
    fatPerKg: "0.9",
    carbsPerKg: "2.5",
  });

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Открываю профили...</div>;
  }

  const selectedUser = getSelectedUser(state);
  if (!selectedUser) {
    return (
      <EmptyState
        title="Профилей пока нет"
        description="Создайте первый профиль ниже, и приложение сразу начнет считать дневную норму."
      />
    );
  }

  const targets = calculateTargets(selectedUser);
  const draftWeight = sanitizeNumber(draft.weightKg, 0);
  const draftProtein = sanitizeNumber(draft.proteinPerKg, 0);
  const draftFat = sanitizeNumber(draft.fatPerKg, 0);
  const draftCarbs = sanitizeNumber(draft.carbsPerKg, 0);
  const draftTargets = calculateTargets({
    ...selectedUser,
    id: "preview",
    name: draft.name || "Новый профиль",
    sex: draft.sex,
    weightKg: draftWeight || 0,
    proteinPerKg: draftProtein || 0,
    fatPerKg: draftFat || 0,
    carbsPerKg: draftCarbs || 0,
    createdAt: "",
    updatedAt: "",
  });

  const profileNameValid = selectedUser.name.trim().length > 0;
  const draftValid =
    draft.name.trim().length >= 2 &&
    draftWeight > 0 &&
    draftProtein > 0 &&
    draftFat > 0 &&
    draftCarbs > 0;

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-[linear-gradient(150deg,#fffef9_0%,#f4fef8_50%,#fff1f6_100%)] px-5 py-5 shadow-[0_18px_50px_rgba(121,139,147,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Profile</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Профили и формула</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Один профиль = одна актуальная дневная норма. Изменения видны сразу, без ручных целей по дням.
        </p>
      </section>

      <UserSwitcher users={state.profiles} selectedUserId={selectedUser.id} onSelect={setSelectedUser} />

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Текущий профиль</h2>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Удалить профиль ${selectedUser.name}?`)) {
                deleteProfile(selectedUser.id);
              }
            }}
            className="rounded-full bg-[var(--color-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-danger)]"
          >
            Удалить
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <label className="text-sm font-medium text-slate-600">
              Имя
              <input
                className={`${inputClass} ${!profileNameValid ? "border-[var(--color-danger)]" : ""}`}
                value={selectedUser.name}
                onChange={(event) => updateProfile(selectedUser.id, { name: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Пол
              <select
                className={inputClass}
                value={selectedUser.sex}
                onChange={(event) =>
                  updateProfile(selectedUser.id, { sex: event.target.value === "male" ? "male" : "female" })
                }
              >
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
              </select>
            </label>
          </div>

          <label className="text-sm font-medium text-slate-600">
            Вес, кг
            <input
              className={inputClass}
              type="number"
              min="1"
              step="0.1"
              value={selectedUser.weightKg}
              onChange={(event) =>
                updateProfile(selectedUser.id, {
                  weightKg: sanitizeNumber(event.target.value, selectedUser.weightKg),
                })
              }
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm font-medium text-slate-600">
              Белки / кг
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="0.1"
                value={selectedUser.proteinPerKg}
                onChange={(event) =>
                  updateProfile(selectedUser.id, {
                    proteinPerKg: sanitizeNumber(event.target.value, selectedUser.proteinPerKg),
                  })
                }
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Жиры / кг
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="0.1"
                value={selectedUser.fatPerKg}
                onChange={(event) =>
                  updateProfile(selectedUser.id, {
                    fatPerKg: sanitizeNumber(event.target.value, selectedUser.fatPerKg),
                  })
                }
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Углеводы / кг
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="0.1"
                value={selectedUser.carbsPerKg}
                onChange={(event) =>
                  updateProfile(selectedUser.id, {
                    carbsPerKg: sanitizeNumber(event.target.value, selectedUser.carbsPerKg),
                  })
                }
              />
            </label>
          </div>
        </div>
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Формула и норма</h2>
            <p className="mt-1 text-sm text-slate-500">Норма обновляется сразу при любом изменении параметров.</p>
          </div>
          <div className="rounded-full bg-[var(--color-mint-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-mint)]">
            {targets.kcal} ккал
          </div>
        </div>
        <div className="mt-4 rounded-[1.35rem] bg-white px-4 py-4 text-sm leading-6 text-slate-600">
          Белки = {selectedUser.weightKg} × {selectedUser.proteinPerKg}, жиры = {selectedUser.weightKg} ×{" "}
          {selectedUser.fatPerKg}, углеводы = {selectedUser.weightKg} × {selectedUser.carbsPerKg}.
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Калории</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{targets.kcal}</div>
          </div>
          <div className="rounded-[1.35rem] bg-white px-4 py-4 text-sm text-slate-600">
            <div>Б {targets.protein}</div>
            <div className="mt-1">Ж {targets.fat}</div>
            <div className="mt-1">У {targets.carbs}</div>
          </div>
        </div>
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Новый профиль</h2>
            <p className="mt-1 text-sm text-slate-500">Быстро добавьте еще один план и переключайтесь между ними.</p>
          </div>
          <div className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-600">
            {draftTargets.kcal} ккал
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <label className="text-sm font-medium text-slate-600">
              Имя
              <input
                className={`${inputClass} ${draft.name.trim().length > 0 && draft.name.trim().length < 2 ? "border-[var(--color-danger)]" : ""}`}
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Например, Ирина"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Пол
              <select
                className={inputClass}
                value={draft.sex}
                onChange={(event) =>
                  setDraft({ ...draft, sex: event.target.value === "male" ? "male" : "female" })
                }
              >
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
              </select>
            </label>
          </div>

          <label className="text-sm font-medium text-slate-600">
            Вес
            <input
              className={inputClass}
              type="number"
              min="1"
              step="0.1"
              value={draft.weightKg}
              onChange={(event) => setDraft({ ...draft, weightKg: event.target.value })}
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm font-medium text-slate-600">
              Б / кг
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="0.1"
                value={draft.proteinPerKg}
                onChange={(event) => setDraft({ ...draft, proteinPerKg: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Ж / кг
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="0.1"
                value={draft.fatPerKg}
                onChange={(event) => setDraft({ ...draft, fatPerKg: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              У / кг
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="0.1"
                value={draft.carbsPerKg}
                onChange={(event) => setDraft({ ...draft, carbsPerKg: event.target.value })}
              />
            </label>
          </div>

          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Предпросмотр нормы: Б {draftTargets.protein} • Ж {draftTargets.fat} • У {draftTargets.carbs} •{" "}
            {draftTargets.kcal} ккал
          </div>

          {!draftValid && draft.name.trim().length > 0 ? (
            <div className="rounded-[1.25rem] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
              Для нового профиля нужны имя и положительные значения веса и коэффициентов.
            </div>
          ) : null}

          <button
            type="button"
            disabled={!draftValid}
            onClick={() => {
              createProfile({
                name: draft.name.trim(),
                sex: draft.sex,
                weightKg: draftWeight,
                proteinPerKg: draftProtein,
                fatPerKg: draftFat,
                carbsPerKg: draftCarbs,
              });
              setDraft({
                name: "",
                sex: "female",
                weightKg: "60",
                proteinPerKg: "1.8",
                fatPerKg: "0.9",
                carbsPerKg: "2.5",
              });
            }}
            className="rounded-[1.2rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(243,124,165,0.32)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Создать профиль
          </button>
        </div>
      </section>
    </div>
  );
}
