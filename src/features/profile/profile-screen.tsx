"use client";

import { useMemo, useState } from "react";
import { UserSwitcher } from "@/components/user-switcher";
import { FORMULA_PRESETS } from "@/lib/constants";
import { calculateTargets, resolveProfileFormula } from "@/lib/macros";
import { getSelectedUser } from "@/lib/selectors";
import { buildTransferState, decodeTransferKey, downloadStateBackup, encodeTransferKey } from "@/lib/transfer";
import type { ActivityLevel, FormulaMode, PersistedAppState } from "@/lib/types";
import { activityLabel, formulaLabel, sanitizeNumber, useAppStore } from "@/store/app-store";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] outline-none";

const formulaDescriptions: Record<FormulaMode, string> = {
  lose: "Мягкий дефицит по Миффлину-Сан Жеора: TDEE - 15%.",
  maintain: "Поддержание по Миффлину-Сан Жеора без дефицита.",
  gain: "Спокойный профицит по Миффлину-Сан Жеора: TDEE + 10%.",
  custom: "Свои Б/Ж/У на кг вручную.",
};

type ProfileDraft = {
  name: string;
  sex: "female" | "male";
  age: string;
  activityLevel: ActivityLevel;
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
  age: "30",
  activityLevel: "sedentary",
  heightCm: "",
  weightKg: "",
  goalWeightKg: "",
  formulaMode: "maintain",
  proteinPerKg: String(FORMULA_PRESETS.maintain.proteinPerKg),
  fatPerKg: String(FORMULA_PRESETS.maintain.fatPerKg),
  carbsPerKg: "0",
};

export function ProfileScreen() {
  const { state, createProfile, deleteProfile, replaceState, setSelectedUser, updateProfile } = useAppStore();
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showTransferImport, setShowTransferImport] = useState(false);
  const [transferKeyInput, setTransferKeyInput] = useState("");
  const [transferError, setTransferError] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedUser = getSelectedUser(state);
  const transferKey = useMemo(() => encodeTransferKey(buildTransferState(state)), [state]);

  const draftAge = sanitizeNumber(draft.age, 30);
  const draftHeight = sanitizeNumber(draft.heightCm, 0);
  const draftWeight = sanitizeNumber(draft.weightKg, 0);
  const draftGoalWeight = sanitizeNumber(draft.goalWeightKg, 0);
  const draftProtein = sanitizeNumber(draft.proteinPerKg, FORMULA_PRESETS.maintain.proteinPerKg);
  const draftFat = sanitizeNumber(draft.fatPerKg, FORMULA_PRESETS.maintain.fatPerKg);
  const draftCarbs = sanitizeNumber(draft.carbsPerKg, 0);
  const draftFormula = useMemo(
    () =>
      draft.formulaMode === "custom"
        ? {
            proteinPerKg: draftProtein,
            fatPerKg: draftFat,
            carbsPerKg: draftCarbs,
          }
        : FORMULA_PRESETS[draft.formulaMode],
    [draft.formulaMode, draftProtein, draftFat, draftCarbs],
  );
  const draftValid =
    draft.name.trim().length >= 2 &&
    draftAge >= 14 &&
    draftHeight > 0 &&
    draftWeight > 0 &&
    draftGoalWeight > 0 &&
    draftFormula.proteinPerKg > 0 &&
    draftFormula.fatPerKg > 0 &&
    (draft.formulaMode !== "custom" || draftFormula.carbsPerKg >= 0);

  const draftPreview = useMemo(
    () =>
      calculateTargets({
        id: "preview",
        name: draft.name || "Новый профиль",
        sex: draft.sex,
        age: draftAge,
        activityLevel: draft.activityLevel,
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
    [draft, draftAge, draftFormula, draftGoalWeight, draftHeight, draftWeight],
  );

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Открываю профиль...</div>;
  }

  const saveNewProfile = () => {
    createProfile({
      name: draft.name.trim(),
      sex: draft.sex,
      age: draftAge,
      activityLevel: draft.activityLevel,
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

  const importTransferKey = () => {
    try {
      const importedState = decodeTransferKey(transferKeyInput);
      replaceState(importedState as PersistedAppState);
      setTransferKeyInput("");
      setTransferError("");
      setShowTransferImport(false);
      setShowCreateProfile(false);
    } catch {
      setTransferError("Ключ не подошел. Проверьте, что вставили его целиком.");
    }
  };

  const copyTransferKey = async () => {
    try {
      await navigator.clipboard.writeText(transferKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="space-y-4">
        <section className="app-card rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Профиль</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Создайте профиль или перенесите данные</h1>
          <p className="mt-2 text-sm text-slate-500">Можно начать с нового профиля или вставить ключ переноса из другого браузера.</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateProfile(true);
                setShowTransferImport(false);
                setTransferError("");
              }}
              className="theme-accent-button rounded-[1.2rem] px-5 py-3 text-sm font-semibold"
            >
              Создать профиль
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTransferImport((value) => !value);
                setShowCreateProfile(false);
                setTransferError("");
              }}
              className="theme-elevated rounded-[1.2rem] px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Ввести ключ
            </button>
          </div>

          {showTransferImport ? (
            <div className="theme-important mt-5 rounded-[1.4rem] px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">Ключ переноса</div>
              <p className="mt-1 text-sm text-slate-600">Вставьте ключ из другого браузера, и данные загрузятся сюда.</p>
              <textarea
                value={transferKeyInput}
                onChange={(event) => setTransferKeyInput(event.target.value)}
                className="theme-input mt-3 min-h-28 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
                placeholder="Вставьте ключ переноса"
              />
              {transferError ? <div className="theme-status-warning mt-3 rounded-[1rem] px-4 py-3 text-sm">{transferError}</div> : null}
              <button
                type="button"
                onClick={importTransferKey}
                disabled={!transferKeyInput.trim()}
                className="theme-accent-button mt-4 rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                Перенести данные
              </button>
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
              {selectedUser.age ?? 30} лет • {selectedUser.heightCm ?? "—"} см • {selectedUser.weightKg} кг
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Цель {selectedUser.goalWeightKg ?? selectedUser.weightKg} кг • {activityLabel(selectedUser.activityLevel ?? "sedentary")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEditProfile((value) => !value)}
            className="theme-accent-button rounded-[1rem] px-4 py-3 text-sm font-semibold"
          >
            {showEditProfile ? "Закрыть" : "Зайти"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[1.25rem] bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Цель</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{targets.kcal} ккал</div>
            <div className="mt-2 text-xs text-slate-500">{formulaLabel(selectedUser.formulaMode)}</div>
          </div>
          <div className="rounded-[1.25rem] bg-white px-4 py-4 text-sm text-slate-600">
            <div>Б {targets.protein}</div>
            <div className="mt-1">Ж {targets.fat}</div>
            <div className="mt-1">У {targets.carbs}</div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] bg-[var(--color-mint-soft)] px-4 py-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">{formulaLabel(selectedUser.formulaMode)}</div>
          <div className="mt-1">{formulaDescriptions[selectedUser.formulaMode]}</div>
          <div className="mt-2">
            Б {selectedFormula.proteinPerKg} / Ж {selectedFormula.fatPerKg} на кг • У {selectedFormula.carbsPerKg} на кг
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Клетчатка {targets.fiber} г • Магний {targets.magnesium} мг • Железо {targets.iron} мг
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
            <h2 className="text-lg font-semibold text-slate-900">Перенос и выгрузка данных</h2>
            <p className="mt-1 text-sm text-slate-500">Можно перенести данные в другой браузер по ключу или скачать backup-файл.</p>
          </div>
        </div>

        <div className="theme-important mt-4 rounded-[1.35rem] px-4 py-4">
          <div className="text-sm font-semibold text-slate-900">Ключ переноса</div>
          <p className="mt-1 text-sm text-slate-600">Скопируйте этот ключ и вставьте его в другом браузере вместо создания профиля.</p>
          <textarea
            value={transferKey}
            readOnly
            className="theme-input mt-3 min-h-28 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={copyTransferKey} className="theme-accent-button rounded-[1rem] px-5 py-3 text-sm font-semibold">
              {copied ? "Скопировано" : "Скопировать ключ"}
            </button>
            <button
              type="button"
              onClick={() => downloadStateBackup(buildTransferState(state))}
              className="theme-elevated rounded-[1rem] px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Скачать backup
            </button>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setShowTransferImport((value) => !value);
              setTransferError("");
            }}
            className="theme-elevated rounded-[1rem] px-4 py-3 text-sm font-semibold text-slate-700"
          >
            {showTransferImport ? "Скрыть импорт" : "Ввести ключ переноса"}
          </button>

          {showTransferImport ? (
            <div className="mt-4 rounded-[1.2rem] bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">Импорт ключа</div>
              <textarea
                value={transferKeyInput}
                onChange={(event) => setTransferKeyInput(event.target.value)}
                className="theme-input mt-3 min-h-28 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 outline-none"
                placeholder="Вставьте ключ переноса"
              />
              {transferError ? <div className="theme-status-warning mt-3 rounded-[1rem] px-4 py-3 text-sm">{transferError}</div> : null}
              <button
                type="button"
                onClick={importTransferKey}
                disabled={!transferKeyInput.trim()}
                className="theme-accent-button mt-4 rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                Загрузить данные из ключа
              </button>
            </div>
          ) : null}
        </div>
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
  const options: FormulaMode[] = ["lose", "maintain", "gain", "custom"];

  return (
    <div>
      <div className="text-sm font-medium text-slate-600">Формула</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-[1rem] px-4 py-3 text-left text-sm transition ${
              value === mode ? "bg-[var(--color-accent)] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            <div className="font-semibold">{formulaLabel(mode)}</div>
            <div className={`mt-1 text-xs leading-5 ${value === mode ? "text-white/80" : "text-slate-500"}`}>
              {formulaDescriptions[mode]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActivityInput({
  value,
  onChange,
}: {
  value: ActivityLevel;
  onChange: (value: ActivityLevel) => void;
}) {
  const options: ActivityLevel[] = ["sedentary", "light", "moderate", "high"];

  return (
    <label className="text-sm font-medium text-slate-600">
      Активность
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value as ActivityLevel)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {activityLabel(option)}
          </option>
        ))}
      </select>
    </label>
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
  if (mode !== "custom") {
    const preset = FORMULA_PRESETS[mode];

    return (
      <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">{formulaLabel(mode)}</div>
        <div className="mt-1">{formulaDescriptions[mode]}</div>
        <div className="mt-2">Б {preset.proteinPerKg} / Ж {preset.fatPerKg} на кг • У авто по остаточным калориям</div>
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
          min="0"
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
        Возраст
        <input
          className={inputClass}
          type="number"
          min="14"
          step="1"
          value={draft.age}
          onChange={(event) => onChange({ ...draft, age: event.target.value })}
          placeholder="Возраст"
        />
      </label>

      <ActivityInput value={draft.activityLevel} onChange={(activityLevel) => onChange({ ...draft, activityLevel })} />

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
        <div className="mt-2 text-xs text-slate-500">
          Клетчатка {preview.fiber} г • Магний {preview.magnesium} мг • Цинк {preview.zinc} мг
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-[1rem] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
            Отмена
          </button>
        ) : null}
        <button
          type="button"
          disabled={!valid}
          onClick={onSubmit}
          className="theme-accent-button ml-auto rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
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
    age?: number;
    activityLevel?: ActivityLevel;
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
        Возраст
        <input
          className={inputClass}
          type="number"
          min="14"
          step="1"
          value={user.age ?? 30}
          onChange={(event) => onUpdate({ age: sanitizeNumber(event.target.value, user.age ?? 30) })}
        />
      </label>

      <ActivityInput value={user.activityLevel ?? "sedentary"} onChange={(activityLevel) => onUpdate({ activityLevel })} />

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
              changes.proteinPerKg === undefined ? undefined : sanitizeNumber(changes.proteinPerKg, user.proteinPerKg),
            fatPerKg: changes.fatPerKg === undefined ? undefined : sanitizeNumber(changes.fatPerKg, user.fatPerKg),
            carbsPerKg:
              changes.carbsPerKg === undefined ? undefined : sanitizeNumber(changes.carbsPerKg, user.carbsPerKg),
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
