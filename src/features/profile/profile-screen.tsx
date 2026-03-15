"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { UserSwitcher } from "@/components/user-switcher";
import { calculateTargets, getHealthyGoalFloor, getPlanningWeight } from "@/lib/macros";
import { getSelectedUser } from "@/lib/selectors";
import { useAppStore, sanitizeNumber } from "@/store/app-store";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

export function ProfileScreen() {
  const { state, createProfile, deleteProfile, setSelectedUser, updateProfile } = useAppStore();
  const [draft, setDraft] = useState<{
    name: string;
    sex: "female" | "male";
    heightCm: string;
    weightKg: string;
    goalWeightKg: string;
    proteinPerKg: string;
    fatPerKg: string;
    carbsPerKg: string;
  }>({
    name: "",
    sex: "female",
    heightCm: "168",
    weightKg: "60",
    goalWeightKg: "56",
    proteinPerKg: "2",
    fatPerKg: "1.5",
    carbsPerKg: "3",
  });
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Открываю профиль...</div>;
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
  const planningWeight = getPlanningWeight(selectedUser);
  const healthyGoalFloor = getHealthyGoalFloor(selectedUser.heightCm);
  const draftHeight = sanitizeNumber(draft.heightCm, 0);
  const draftWeight = sanitizeNumber(draft.weightKg, 0);
  const draftGoalWeight = sanitizeNumber(draft.goalWeightKg, 0);
  const draftProtein = sanitizeNumber(draft.proteinPerKg, 0);
  const draftFat = sanitizeNumber(draft.fatPerKg, 0);
  const draftCarbs = sanitizeNumber(draft.carbsPerKg, 0);
  const draftTargets = calculateTargets({
    ...selectedUser,
    id: "preview",
    name: draft.name || "Новый профиль",
    sex: draft.sex,
    heightCm: draftHeight || null,
    weightKg: draftWeight || 0,
    goalWeightKg: draftGoalWeight || draftWeight || 0,
    proteinPerKg: draftProtein || 0,
    fatPerKg: draftFat || 0,
    carbsPerKg: draftCarbs || 0,
    createdAt: "",
    updatedAt: "",
  });

  const profileNameValid = selectedUser.name.trim().length > 0;
  const draftValid =
    draft.name.trim().length >= 2 &&
    draftHeight > 0 &&
    draftWeight > 0 &&
    draftGoalWeight > 0 &&
    draftProtein > 0 &&
    draftFat > 0 &&
    draftCarbs > 0;

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-[linear-gradient(150deg,#fff9f5_0%,#eefcf7_50%,#ffe6ef_100%)] px-5 py-5 shadow-[0_18px_50px_rgba(121,139,147,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Profile</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Спокойный план под один профиль</h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Вводите рост, текущий и желаемый вес. Дневная цель считается мягко по плановому весу, чтобы рацион оставался выполнимым.
        </p>
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Текущий профиль</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedUser.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedUser.weightKg} → {selectedUser.goalWeightKg ?? selectedUser.weightKg} кг • {targets.kcal} ккал в день
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {state.profiles.length > 1 ? (
              <button
                type="button"
                onClick={() => setShowSwitcher((value) => !value)}
                className="rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)]"
              >
                {showSwitcher ? "Скрыть профили" : "Сменить профиль"}
              </button>
            ) : null}
            {state.profiles.length > 1 ? (
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
            ) : null}
          </div>
        </div>

        {showSwitcher && state.profiles.length > 1 ? (
          <div className="mt-4">
            <UserSwitcher users={state.profiles} selectedUserId={selectedUser.id} onSelect={setSelectedUser} />
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Рост</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{selectedUser.heightCm ?? "—"} см</div>
          </div>
          <div className="rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Плановый вес</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{planningWeight} кг</div>
          </div>
          <div className="rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Цель</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{targets.kcal} ккал</div>
          </div>
        </div>
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Параметры</h2>
            <p className="mt-1 text-sm text-slate-500">Норма обновляется сразу, как только вы меняете поля ниже.</p>
          </div>
          <div className="rounded-full bg-[var(--color-mint-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-mint)]">
            {targets.kcal} ккал
          </div>
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

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-slate-600">
              Рост, см
              <input
                className={inputClass}
                type="number"
                min="100"
                step="1"
                value={selectedUser.heightCm ?? ""}
                onChange={(event) =>
                  updateProfile(selectedUser.id, {
                    heightCm: sanitizeNumber(event.target.value, selectedUser.heightCm ?? 0),
                  })
                }
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Текущий вес, кг
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
          </div>

          <label className="text-sm font-medium text-slate-600">
            Желаемый вес, кг
            <input
              className={inputClass}
              type="number"
              min="1"
              step="0.1"
              value={selectedUser.goalWeightKg ?? selectedUser.weightKg}
              onChange={(event) =>
                updateProfile(selectedUser.id, {
                  goalWeightKg: sanitizeNumber(event.target.value, selectedUser.goalWeightKg ?? selectedUser.weightKg),
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

        <div className="mt-4 rounded-[1.35rem] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
          Формула из таблицы: Б = плановый вес × {selectedUser.proteinPerKg}, Ж = плановый вес × {selectedUser.fatPerKg},
          У = плановый вес × {selectedUser.carbsPerKg}. Сейчас плановый вес = {planningWeight} кг.
          {healthyGoalFloor ? ` Нижняя спокойная граница по росту: ${healthyGoalFloor} кг.` : ""}
        </div>
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Дополнительный профиль</h2>
            <p className="mt-1 text-sm text-slate-500">Создавайте второй профиль только если он действительно нужен.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateProfile((value) => !value)}
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            {showCreateProfile ? "Скрыть" : "Добавить профиль"}
          </button>
        </div>

        {showCreateProfile ? (
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
                  onChange={(event) => setDraft({ ...draft, sex: event.target.value === "male" ? "male" : "female" })}
                >
                  <option value="female">Женский</option>
                  <option value="male">Мужской</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-600">
                Рост
                <input
                  className={inputClass}
                  type="number"
                  min="100"
                  step="1"
                  value={draft.heightCm}
                  onChange={(event) => setDraft({ ...draft, heightCm: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Текущий вес
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="0.1"
                  value={draft.weightKg}
                  onChange={(event) => setDraft({ ...draft, weightKg: event.target.value })}
                />
              </label>
            </div>

            <label className="text-sm font-medium text-slate-600">
              Желаемый вес
              <input
                className={inputClass}
                type="number"
                min="1"
                step="0.1"
                value={draft.goalWeightKg}
                onChange={(event) => setDraft({ ...draft, goalWeightKg: event.target.value })}
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
              Предпросмотр цели: Б {draftTargets.protein} • Ж {draftTargets.fat} • У {draftTargets.carbs} •{" "}
              {draftTargets.kcal} ккал
            </div>

            {!draftValid && draft.name.trim().length > 0 ? (
              <div className="rounded-[1.25rem] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
                Для нового профиля нужны имя, рост, текущий вес, желаемый вес и положительные коэффициенты.
              </div>
            ) : null}

            <button
              type="button"
              disabled={!draftValid}
              onClick={() => {
                createProfile({
                  name: draft.name.trim(),
                  sex: draft.sex,
                  heightCm: draftHeight,
                  weightKg: draftWeight,
                  goalWeightKg: draftGoalWeight,
                  proteinPerKg: draftProtein,
                  fatPerKg: draftFat,
                  carbsPerKg: draftCarbs,
                });
                setDraft({
                  name: "",
                  sex: "female",
                  heightCm: "168",
                  weightKg: "60",
                  goalWeightKg: "56",
                  proteinPerKg: "2",
                  fatPerKg: "1.5",
                  carbsPerKg: "3",
                });
                setShowCreateProfile(false);
                setShowSwitcher(true);
              }}
              className="rounded-[1.2rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(243,124,165,0.32)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Создать профиль
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
