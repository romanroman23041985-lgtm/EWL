"use client";

import { useMemo, useState } from "react";
import { STANDARD_FORMULA } from "@/lib/constants";
import { calculateTargets, resolveProfileFormula } from "@/lib/macros";
import { getSelectedUser } from "@/lib/selectors";
import type { FormulaMode } from "@/lib/types";
import { formulaLabel, useAppStore, sanitizeNumber } from "@/store/app-store";
import { UserSwitcher } from "@/components/user-switcher";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

type ProfileDraft = {
  name: string;
  sex: "female" | "male";
  heightCm: string;
  weightKg: string;
  goalWeightKg: string;
  formulaMode: FormulaMode;
  proteinPerKg: string;
  fatPerKg: string;
  carbsPerKg: string;
};

const emptyDraft: ProfileDraft = {
  name: "",
  sex: "female",
  heightCm: "",
  weightKg: "",
  goalWeightKg: "",
  formulaMode: "standard",
  proteinPerKg: String(STANDARD_FORMULA.proteinPerKg),
  fatPerKg: String(STANDARD_FORMULA.fatPerKg),
  carbsPerKg: String(STANDARD_FORMULA.carbsPerKg),
};

export function ProfileScreen() {
  const { state, createProfile, deleteProfile, setSelectedUser, updateProfile } = useAppStore();
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const selectedUser = getSelectedUser(state);
  const draftHeight = sanitizeNumber(draft.heightCm, 0);
  const draftWeight = sanitizeNumber(draft.weightKg, 0);
  const draftGoalWeight = sanitizeNumber(draft.goalWeightKg, 0);
  const draftProtein = sanitizeNumber(draft.proteinPerKg, STANDARD_FORMULA.proteinPerKg);
  const draftFat = sanitizeNumber(draft.fatPerKg, STANDARD_FORMULA.fatPerKg);
  const draftCarbs = sanitizeNumber(draft.carbsPerKg, STANDARD_FORMULA.carbsPerKg);
  const draftFormula = useMemo(
    () =>
      draft.formulaMode === "standard"
        ? STANDARD_FORMULA
        : {
            proteinPerKg: draftProtein,
            fatPerKg: draftFat,
            carbsPerKg: draftCarbs,
          },
    [draft.formulaMode, draftProtein, draftFat, draftCarbs],
  );
  const draftValid =
    draft.name.trim().length >= 2 &&
    draftHeight > 0 &&
    draftWeight > 0 &&
    draftGoalWeight > 0 &&
    draftFormula.proteinPerKg > 0 &&
    draftFormula.fatPerKg > 0 &&
    draftFormula.carbsPerKg > 0;

  const draftPreview = useMemo(
    () =>
      calculateTargets({
        id: "preview",
        name: draft.name || "Новый профиль",
        sex: draft.sex,
        heightCm: draftHeight || null,
        weightKg: draftWeight || 0,
        goalWeightKg: draftGoalWeight || draftWeight || 0,
        formulaMode: draft.formulaMode,
        proteinPerKg: draftFormula.proteinPerKg,
        fatPerKg: draftFormula.fatPerKg,
        carbsPerKg: draftFormula.carbsPerKg,
        createdAt: "",
        updatedAt: "",
      }),
    [draft, draftFormula, draftGoalWeight, draftHeight, draftWeight],
  );

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Открываю профиль...</div>;
  }

  const saveNewProfile = () => {
    createProfile({
      name: draft.name.trim(),
      sex: draft.sex,
      heightCm: draftHeight,
      weightKg: draftWeight,
      goalWeightKg: draftGoalWeight,
      formulaMode: draft.formulaMode,
      proteinPerKg: draftFormula.proteinPerKg,
      fatPerKg: draftFormula.fatPerKg,
      carbsPerKg: draftFormula.carbsPerKg,
    });
    setDraft(emptyDraft);
    setShowCreateProfile(false);
    setShowEditProfile(false);
    setShowSwitcher(false);
  };

  if (!selectedUser) {
    return (
      <div className="space-y-4">
        <section className="app-card rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Профиль</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Создайте профиль</h1>
          <p className="mt-2 text-sm text-slate-500">Введите имя, пол, рост, вес и желаемый вес.</p>

          {!showCreateProfile ? (
            <button
              type="button"
              onClick={() => setShowCreateProfile(true)}
              className="mt-5 rounded-[1.2rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Создать профиль
            </button>
          ) : (
            <div className="mt-5">
              <ProfileForm
                draft={draft}
                onChange={setDraft}
                preview={draftPreview}
                valid={draftValid}
                onSubmit={saveNewProfile}
                onCancel={() => {
                  setShowCreateProfile(false);
                  setDraft(emptyDraft);
                }}
              />
            </div>
          )}
        </section>
      </div>
    );
  }

  const targets = calculateTargets(selectedUser);
  const selectedFormula = resolveProfileFormula(selectedUser);

  return (
    <div className="space-y-4">
      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Профиль</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{selectedUser.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {selectedUser.heightCm ?? "—"} см • {selectedUser.weightKg} кг • цель {selectedUser.goalWeightKg ?? selectedUser.weightKg} кг
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEditProfile((value) => !value)}
            className="rounded-[1rem] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            {showEditProfile ? "Закрыть" : "Зайти"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[1.25rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Цель</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{targets.kcal} ккал</div>
            <div className="mt-2 text-xs text-slate-500">{formulaLabel(selectedUser.formulaMode)} формула</div>
          </div>
          <div className="rounded-[1.25rem] bg-white px-4 py-4 text-sm text-slate-600">
            <div>Б {targets.protein}</div>
            <div className="mt-1">Ж {targets.fat}</div>
            <div className="mt-1">У {targets.carbs}</div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] bg-[var(--color-mint-soft)] px-4 py-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Формула</div>
          <div className="mt-1">
            {formulaLabel(selectedUser.formulaMode)} • Б {selectedFormula.proteinPerKg} / Ж {selectedFormula.fatPerKg} / У {selectedFormula.carbsPerKg} на кг
          </div>
        </div>

        {showEditProfile ? (
          <div className="mt-5">
            <CurrentProfileForm
              user={selectedUser}
              onUpdate={(changes) => updateProfile(selectedUser.id, changes)}
              onDelete={
                state.profiles.length > 1
                  ? () => {
                      if (window.confirm(`Удалить профиль ${selectedUser.name}?`)) {
                        deleteProfile(selectedUser.id);
                      }
                    }
                  : undefined
              }
            />
          </div>
        ) : null}
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Дополнительный профиль</h2>
            <p className="mt-1 text-sm text-slate-500">Здесь можно добавить второй профиль или быстро переключиться.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateProfile((value) => !value)}
            className="rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)]"
          >
            {showCreateProfile ? "Скрыть" : "Создать профиль"}
          </button>
        </div>

        {state.profiles.length > 1 ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowSwitcher((value) => !value)}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {showSwitcher ? "Скрыть профили" : "Сменить профиль"}
            </button>
            {showSwitcher ? (
              <div className="mt-4">
                <UserSwitcher users={state.profiles} selectedUserId={selectedUser.id} onSelect={setSelectedUser} />
              </div>
            ) : null}
          </div>
        ) : null}

        {showCreateProfile ? (
          <div className="mt-5">
            <ProfileForm
              draft={draft}
              onChange={setDraft}
              preview={draftPreview}
              valid={draftValid}
              onSubmit={saveNewProfile}
              onCancel={() => {
                setShowCreateProfile(false);
                setDraft(emptyDraft);
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FormulaModeSwitch({
  value,
  onChange,
}: {
  value: FormulaMode;
  onChange: (mode: FormulaMode) => void;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-600">Формула</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(["standard", "custom"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`min-h-11 rounded-[1rem] px-4 py-3 text-sm font-semibold ${
              value === mode ? "bg-[var(--color-accent)] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {mode === "standard" ? "Стандартная" : "Своя"}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormulaInputs({
  mode,
  proteinPerKg,
  fatPerKg,
  carbsPerKg,
  onChange,
}: {
  mode: FormulaMode;
  proteinPerKg: string;
  fatPerKg: string;
  carbsPerKg: string;
  onChange: (value: { proteinPerKg?: string; fatPerKg?: string; carbsPerKg?: string }) => void;
}) {
  if (mode === "standard") {
    return (
      <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Стандартная формула</div>
        <div className="mt-2">Б {STANDARD_FORMULA.proteinPerKg} / Ж {STANDARD_FORMULA.fatPerKg} / У {STANDARD_FORMULA.carbsPerKg} на кг</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <label className="text-sm font-medium text-slate-600">
        Б / кг
        <input
          className={inputClass}
          type="number"
          min="0.1"
          step="0.1"
          value={proteinPerKg}
          onChange={(event) => onChange({ proteinPerKg: event.target.value })}
        />
      </label>
      <label className="text-sm font-medium text-slate-600">
        Ж / кг
        <input
          className={inputClass}
          type="number"
          min="0.1"
          step="0.1"
          value={fatPerKg}
          onChange={(event) => onChange({ fatPerKg: event.target.value })}
        />
      </label>
      <label className="text-sm font-medium text-slate-600">
        У / кг
        <input
          className={inputClass}
          type="number"
          min="0.1"
          step="0.1"
          value={carbsPerKg}
          onChange={(event) => onChange({ carbsPerKg: event.target.value })}
        />
      </label>
    </div>
  );
}

function ProfileForm({
  draft,
  onChange,
  preview,
  valid,
  onSubmit,
  onCancel,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  preview: ReturnType<typeof calculateTargets>;
  valid: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="grid gap-4">
      <label className="text-sm font-medium text-slate-600">
        Имя
        <input
          className={inputClass}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="Введите имя"
        />
      </label>

      <label className="text-sm font-medium text-slate-600">
        Пол
        <select
          className={inputClass}
          value={draft.sex}
          onChange={(event) => onChange({ ...draft, sex: event.target.value === "male" ? "male" : "female" })}
        >
          <option value="female">Женский</option>
          <option value="male">Мужской</option>
        </select>
      </label>

      <label className="text-sm font-medium text-slate-600">
        Рост
        <input
          className={inputClass}
          type="number"
          min="100"
          step="1"
          value={draft.heightCm}
          onChange={(event) => onChange({ ...draft, heightCm: event.target.value })}
          placeholder="Рост"
        />
      </label>

      <label className="text-sm font-medium text-slate-600">
        Вес
        <input
          className={inputClass}
          type="number"
          min="1"
          step="0.1"
          value={draft.weightKg}
          onChange={(event) => onChange({ ...draft, weightKg: event.target.value })}
          placeholder="Вес"
        />
      </label>

      <label className="text-sm font-medium text-slate-600">
        Желаемый вес
        <input
          className={inputClass}
          type="number"
          min="1"
          step="0.1"
          value={draft.goalWeightKg}
          onChange={(event) => onChange({ ...draft, goalWeightKg: event.target.value })}
          placeholder="Желаемый вес"
        />
      </label>

      <FormulaModeSwitch value={draft.formulaMode} onChange={(formulaMode) => onChange({ ...draft, formulaMode })} />

      <FormulaInputs
        mode={draft.formulaMode}
        proteinPerKg={draft.proteinPerKg}
        fatPerKg={draft.fatPerKg}
        carbsPerKg={draft.carbsPerKg}
        onChange={(changes) => onChange({ ...draft, ...changes })}
      />

      <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Предпросмотр цели</div>
        <div className="mt-2">{preview.kcal} ккал</div>
        <div className="mt-1">Б {preview.protein} • Ж {preview.fat} • У {preview.carbs}</div>
      </div>

      <div className="flex items-center gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[1rem] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Отмена
          </button>
        ) : null}
        <button
          type="button"
          disabled={!valid}
          onClick={onSubmit}
          className="ml-auto rounded-[1rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          Создать профиль
        </button>
      </div>
    </div>
  );
}

function CurrentProfileForm({
  user,
  onUpdate,
  onDelete,
}: {
  user: NonNullable<ReturnType<typeof getSelectedUser>>;
  onUpdate: (changes: {
    name?: string;
    sex?: "female" | "male";
    heightCm?: number;
    weightKg?: number;
    goalWeightKg?: number;
    formulaMode?: FormulaMode;
    proteinPerKg?: number;
    fatPerKg?: number;
    carbsPerKg?: number;
  }) => void;
  onDelete?: () => void;
}) {
  return (
    <div className="grid gap-4">
      <label className="text-sm font-medium text-slate-600">
        Имя
        <input className={inputClass} value={user.name} onChange={(event) => onUpdate({ name: event.target.value })} />
      </label>

      <label className="text-sm font-medium text-slate-600">
        Пол
        <select
          className={inputClass}
          value={user.sex}
          onChange={(event) => onUpdate({ sex: event.target.value === "male" ? "male" : "female" })}
        >
          <option value="female">Женский</option>
          <option value="male">Мужской</option>
        </select>
      </label>

      <label className="text-sm font-medium text-slate-600">
        Рост
        <input
          className={inputClass}
          type="number"
          min="100"
          step="1"
          value={user.heightCm ?? ""}
          onChange={(event) => onUpdate({ heightCm: sanitizeNumber(event.target.value, user.heightCm ?? 0) })}
        />
      </label>

      <label className="text-sm font-medium text-slate-600">
        Вес
        <input
          className={inputClass}
          type="number"
          min="1"
          step="0.1"
          value={user.weightKg}
          onChange={(event) => onUpdate({ weightKg: sanitizeNumber(event.target.value, user.weightKg) })}
        />
      </label>

      <label className="text-sm font-medium text-slate-600">
        Желаемый вес
        <input
          className={inputClass}
          type="number"
          min="1"
          step="0.1"
          value={user.goalWeightKg ?? user.weightKg}
          onChange={(event) =>
            onUpdate({ goalWeightKg: sanitizeNumber(event.target.value, user.goalWeightKg ?? user.weightKg) })
          }
        />
      </label>

      <FormulaModeSwitch value={user.formulaMode} onChange={(formulaMode) => onUpdate({ formulaMode })} />

      <FormulaInputs
        mode={user.formulaMode}
        proteinPerKg={String(user.proteinPerKg)}
        fatPerKg={String(user.fatPerKg)}
        carbsPerKg={String(user.carbsPerKg)}
        onChange={(changes) =>
          onUpdate({
            proteinPerKg:
              changes.proteinPerKg === undefined
                ? undefined
                : sanitizeNumber(changes.proteinPerKg, user.proteinPerKg),
            fatPerKg:
              changes.fatPerKg === undefined ? undefined : sanitizeNumber(changes.fatPerKg, user.fatPerKg),
            carbsPerKg:
              changes.carbsPerKg === undefined
                ? undefined
                : sanitizeNumber(changes.carbsPerKg, user.carbsPerKg),
          })
        }
      />

      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-[1rem] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)]"
        >
          Удалить профиль
        </button>
      ) : null}
    </div>
  );
}
