"use client";

import { useMemo, useState } from "react";
import { UserSwitcher } from "@/components/user-switcher";
import { FORMULA_PRESETS } from "@/lib/constants";
import { calculateTargets, calculateTdee, resolveProfileFormula } from "@/lib/macros";
import { getSelectedUser } from "@/lib/selectors";
import { buildTransferState, decodeTransferKey, downloadStateBackup, encodeTransferKey } from "@/lib/transfer";
import type {
  ActivityLevel,
  FormulaMode,
  NutritionTotals,
  PersistedAppState,
  UserProfile,
} from "@/lib/types";
import { sanitizeNumber, useAppStore } from "@/store/app-store";

const inputClass =
  "mt-2 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 text-[15px] text-slate-900 outline-none";

const textAreaClass =
  "theme-input mt-3 min-h-28 w-full rounded-[1.2rem] border border-[var(--color-outline)] px-4 py-3 text-[15px] outline-none";

const formulaTitles: Record<FormulaMode, string> = {
  lose: "Похудение",
  maintain: "Поддержание",
  gain: "Набор массы",
  custom: "Своя",
};

const formulaDescriptions: Record<FormulaMode, string> = {
  lose: "Мягкий дефицит по формуле Миффлина - Сан Жеора: TDEE - 15%.",
  maintain: "Комфортное удержание веса без лишнего дефицита.",
  gain: "Спокойный профицит для набора: TDEE + 10%.",
  custom: "Своя формула: Б/Ж/У и нутриенты на день задаете вручную.",
};

const activityTitles: Record<ActivityLevel, string> = {
  sedentary: "Сидячий образ жизни",
  light: "Легкая активность",
  moderate: "Средняя активность",
  high: "Высокая активность",
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
  customKcalTarget: string;
  proteinPerKg: string;
  fatPerKg: string;
  carbsPerKg: string;
  fiberTarget: string;
  magnesiumTarget: string;
  ironTarget: string;
  zincTarget: string;
  omega3Target: string;
  vitaminB12Target: string;
};

type FormulaFieldKey =
  | "proteinPerKg"
  | "fatPerKg"
  | "carbsPerKg"
  | "customKcalTarget"
  | "fiberTarget"
  | "magnesiumTarget"
  | "ironTarget"
  | "zincTarget"
  | "omega3Target"
  | "vitaminB12Target";

type FormulaValues = Pick<ProfileDraft, FormulaFieldKey>;

const emptyDraft: ProfileDraft = {
  name: "",
  sex: "female",
  age: "30",
  activityLevel: "sedentary",
  heightCm: "",
  weightKg: "",
  goalWeightKg: "",
  formulaMode: "maintain",
  customKcalTarget: "",
  proteinPerKg: String(FORMULA_PRESETS.maintain.proteinPerKg),
  fatPerKg: String(FORMULA_PRESETS.maintain.fatPerKg),
  carbsPerKg: "0",
  fiberTarget: "",
  magnesiumTarget: "",
  ironTarget: "",
  zincTarget: "",
  omega3Target: "",
  vitaminB12Target: "",
};

function getPreviewProfile(draft: ProfileDraft): UserProfile {
  return {
    id: "preview",
    name: draft.name || "Новый профиль",
    sex: draft.sex,
    age: sanitizeNumber(draft.age, 30),
    activityLevel: draft.activityLevel,
    heightCm: sanitizeNumber(draft.heightCm, 0) || null,
    weightKg: sanitizeNumber(draft.weightKg, 0),
    goalWeightKg: sanitizeNumber(draft.goalWeightKg, 0) || sanitizeNumber(draft.weightKg, 0),
    formulaMode: draft.formulaMode,
    customKcalTarget: draft.customKcalTarget.trim() ? sanitizeNumber(draft.customKcalTarget, 0) : null,
    proteinPerKg: sanitizeNumber(draft.proteinPerKg, FORMULA_PRESETS.maintain.proteinPerKg),
    fatPerKg: sanitizeNumber(draft.fatPerKg, FORMULA_PRESETS.maintain.fatPerKg),
    carbsPerKg: sanitizeNumber(draft.carbsPerKg, 0),
    fiberTarget: draft.fiberTarget.trim() ? sanitizeNumber(draft.fiberTarget, 0) : null,
    magnesiumTarget: draft.magnesiumTarget.trim() ? sanitizeNumber(draft.magnesiumTarget, 0) : null,
    ironTarget: draft.ironTarget.trim() ? sanitizeNumber(draft.ironTarget, 0) : null,
    zincTarget: draft.zincTarget.trim() ? sanitizeNumber(draft.zincTarget, 0) : null,
    omega3Target: draft.omega3Target.trim() ? sanitizeNumber(draft.omega3Target, 0) : null,
    vitaminB12Target: draft.vitaminB12Target.trim() ? sanitizeNumber(draft.vitaminB12Target, 0) : null,
    createdAt: "",
    updatedAt: "",
  };
}

function buildDraftPreview(draft: ProfileDraft) {
  return calculateTargets(getPreviewProfile(draft));
}

function getDraftFormulaValues(draft: ProfileDraft): FormulaValues {
  return {
    proteinPerKg: draft.proteinPerKg,
    fatPerKg: draft.fatPerKg,
    carbsPerKg: draft.carbsPerKg,
    customKcalTarget: draft.customKcalTarget,
    fiberTarget: draft.fiberTarget,
    magnesiumTarget: draft.magnesiumTarget,
    ironTarget: draft.ironTarget,
    zincTarget: draft.zincTarget,
    omega3Target: draft.omega3Target,
    vitaminB12Target: draft.vitaminB12Target,
  };
}

function getProfileFormulaValues(user: UserProfile): FormulaValues {
  const fallback = calculateTargets({ ...user, formulaMode: user.formulaMode === "custom" ? "maintain" : user.formulaMode });
  return ensureCustomFormulaFields(
    {
      proteinPerKg: String(user.proteinPerKg),
      fatPerKg: String(user.fatPerKg),
      carbsPerKg: String(user.carbsPerKg),
      customKcalTarget: user.customKcalTarget == null ? "" : String(user.customKcalTarget),
      fiberTarget: user.fiberTarget == null ? "" : String(user.fiberTarget),
      magnesiumTarget: user.magnesiumTarget == null ? "" : String(user.magnesiumTarget),
      ironTarget: user.ironTarget == null ? "" : String(user.ironTarget),
      zincTarget: user.zincTarget == null ? "" : String(user.zincTarget),
      omega3Target: user.omega3Target == null ? "" : String(user.omega3Target),
      vitaminB12Target: user.vitaminB12Target == null ? "" : String(user.vitaminB12Target),
    },
    fallback,
  );
}

function ensureCustomFormulaFields(values: FormulaValues, fallback: NutritionTotals): FormulaValues {
  return {
    proteinPerKg: values.proteinPerKg || String(FORMULA_PRESETS.maintain.proteinPerKg),
    fatPerKg: values.fatPerKg || String(FORMULA_PRESETS.maintain.fatPerKg),
    carbsPerKg: values.carbsPerKg || "0",
    customKcalTarget: values.customKcalTarget || String(fallback.kcal),
    fiberTarget: values.fiberTarget || String(fallback.fiber),
    magnesiumTarget: values.magnesiumTarget || String(fallback.magnesium),
    ironTarget: values.ironTarget || String(fallback.iron),
    zincTarget: values.zincTarget || String(fallback.zinc),
    omega3Target: values.omega3Target || String(fallback.omega3),
    vitaminB12Target: values.vitaminB12Target || String(fallback.vitaminB12),
  };
}

function applyDraftMode(nextMode: FormulaMode, draft: ProfileDraft): ProfileDraft {
  if (nextMode !== "custom") {
    const preset = FORMULA_PRESETS[nextMode];
    return {
      ...draft,
      formulaMode: nextMode,
      proteinPerKg: String(preset.proteinPerKg),
      fatPerKg: String(preset.fatPerKg),
    };
  }

  const fallback = buildDraftPreview({ ...draft, formulaMode: "maintain" });
  return {
    ...draft,
    formulaMode: nextMode,
    ...ensureCustomFormulaFields(getDraftFormulaValues(draft), fallback),
  };
}

function getNumberOrNull(value: string) {
  return value.trim() ? sanitizeNumber(value, 0) : null;
}

function roundInputValue(value: number) {
  return Math.round(value * 10) / 10;
}

function buildMacroValuesFromCalories(kcal: number, weight: number) {
  if (weight <= 0 || kcal <= 0) {
    return {
      proteinPerKg: "0",
      fatPerKg: "0",
      carbsPerKg: "0",
    };
  }

  const baseProteinPerKg = FORMULA_PRESETS.maintain.proteinPerKg;
  const baseFatPerKg = FORMULA_PRESETS.maintain.fatPerKg;
  const baseProteinCalories = weight * baseProteinPerKg * 4;
  const baseFatCalories = weight * baseFatPerKg * 9;
  const baseCalories = baseProteinCalories + baseFatCalories;

  if (kcal <= baseCalories) {
    const scale = kcal / baseCalories;
    return {
      proteinPerKg: String(roundInputValue(baseProteinPerKg * scale)),
      fatPerKg: String(roundInputValue(baseFatPerKg * scale)),
      carbsPerKg: "0",
    };
  }

  const carbsPerKg = (kcal - baseCalories) / 4 / weight;
  return {
    proteinPerKg: String(roundInputValue(baseProteinPerKg)),
    fatPerKg: String(roundInputValue(baseFatPerKg)),
    carbsPerKg: String(roundInputValue(carbsPerKg)),
  };
}

function calculateMacroCalories(values: Pick<FormulaValues, "proteinPerKg" | "fatPerKg" | "carbsPerKg">, weight: number) {
  const protein = sanitizeNumber(values.proteinPerKg, 0) * weight;
  const fat = sanitizeNumber(values.fatPerKg, 0) * weight;
  const carbs = sanitizeNumber(values.carbsPerKg, 0) * weight;
  return protein * 4 + fat * 9 + carbs * 4;
}

function syncCustomFormulaValues(
  currentValues: FormulaValues,
  changes: Partial<FormulaValues>,
  weight: number,
) {
  const nextValues = {
    ...currentValues,
    ...changes,
  };

  if (changes.customKcalTarget !== undefined) {
    const nextKcal = sanitizeNumber(changes.customKcalTarget, 0);
    const currentMacroCalories = calculateMacroCalories(currentValues, weight);

    if (nextKcal > 0 && currentMacroCalories > 0 && weight > 0) {
      const scale = nextKcal / currentMacroCalories;
      nextValues.proteinPerKg = String(roundInputValue(sanitizeNumber(currentValues.proteinPerKg, 0) * scale));
      nextValues.fatPerKg = String(roundInputValue(sanitizeNumber(currentValues.fatPerKg, 0) * scale));
      nextValues.carbsPerKg = String(roundInputValue(sanitizeNumber(currentValues.carbsPerKg, 0) * scale));
    } else if (nextKcal > 0 && weight > 0) {
      const autoValues = buildMacroValuesFromCalories(nextKcal, weight);
      nextValues.proteinPerKg = autoValues.proteinPerKg;
      nextValues.fatPerKg = autoValues.fatPerKg;
      nextValues.carbsPerKg = autoValues.carbsPerKg;
    }

    nextValues.customKcalTarget = changes.customKcalTarget;
    return nextValues;
  }

  if (
    changes.proteinPerKg !== undefined ||
    changes.fatPerKg !== undefined ||
    changes.carbsPerKg !== undefined
  ) {
    const recalculatedKcal = calculateMacroCalories(nextValues, weight);
    nextValues.customKcalTarget = recalculatedKcal > 0 ? String(Math.round(recalculatedKcal)) : currentValues.customKcalTarget;
  }

  return nextValues;
}

function isDraftValid(draft: ProfileDraft) {
  const commonOk =
    draft.name.trim().length >= 2 &&
    sanitizeNumber(draft.age, 30) >= 14 &&
    sanitizeNumber(draft.heightCm, 0) > 0 &&
    sanitizeNumber(draft.weightKg, 0) > 0 &&
    sanitizeNumber(draft.goalWeightKg, 0) > 0;

  if (!commonOk) {
    return false;
  }

  if (draft.formulaMode !== "custom") {
    return true;
  }

  return (
    sanitizeNumber(draft.proteinPerKg, 0) > 0 &&
    sanitizeNumber(draft.fatPerKg, 0) > 0 &&
    sanitizeNumber(draft.carbsPerKg, 0) >= 0 &&
    sanitizeNumber(draft.customKcalTarget, 0) > 0 &&
    sanitizeNumber(draft.fiberTarget, 0) > 0 &&
    sanitizeNumber(draft.magnesiumTarget, 0) > 0 &&
    sanitizeNumber(draft.ironTarget, 0) > 0 &&
    sanitizeNumber(draft.zincTarget, 0) > 0 &&
    sanitizeNumber(draft.omega3Target, 0) > 0 &&
    sanitizeNumber(draft.vitaminB12Target, 0) > 0
  );
}

function getCustomDeficitWarning(profile: Pick<
  UserProfile,
  "formulaMode" | "customKcalTarget" | "sex" | "weightKg" | "heightCm" | "age" | "activityLevel"
>) {
  if (profile.formulaMode !== "custom" || typeof profile.customKcalTarget !== "number" || profile.customKcalTarget <= 0) {
    return null;
  }

  const tdee = calculateTdee(profile);
  const minimumRecommended = Math.round(tdee * 0.85);

  if (profile.customKcalTarget >= minimumRecommended) {
    return null;
  }

  const deficitPercent = Math.round((1 - profile.customKcalTarget / tdee) * 100);

  return {
    minimumRecommended,
    deficitPercent,
  };
}

function SummaryPreview({
  preview,
  warning,
}: {
  preview: NutritionTotals;
  warning?: {
    minimumRecommended: number;
    deficitPercent: number;
  } | null;
}) {
  return (
    <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <div className="font-semibold text-slate-900">Предпросмотр цели</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{preview.kcal} ккал</div>
      <div className="mt-1">Б {preview.protein} • Ж {preview.fat} • У {preview.carbs}</div>
      <div className="mt-2 text-xs text-slate-500">
        Клетчатка {preview.fiber} г • Магний {preview.magnesium} мг • Железо {preview.iron} мг
      </div>
      <div className="mt-1 text-xs text-slate-500">
        Цинк {preview.zinc} мг • Омега-3 {preview.omega3} г • B12 {preview.vitaminB12} мкг
      </div>
      {warning ? (
        <div className="theme-status-warning mt-3 rounded-[1rem] px-3 py-3 text-xs leading-5">
          Сейчас дефицит около {warning.deficitPercent}%. Это уже слишком жестко. Лучше не опускаться ниже{" "}
          {warning.minimumRecommended} ккал в день, чтобы не делать дефицит больше 15%.
        </div>
      ) : null}
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
            <div className="font-semibold">{formulaTitles[mode]}</div>
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
            {activityTitles[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormulaInputs({
  mode,
  values,
  onChange,
}: {
  mode: FormulaMode;
  values: FormulaValues;
  onChange: (value: Partial<FormulaValues>) => void;
}) {
  if (mode !== "custom") {
    const preset = FORMULA_PRESETS[mode];

    return (
      <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">{formulaTitles[mode]}</div>
        <div className="mt-1">{formulaDescriptions[mode]}</div>
        <div className="mt-2">
          Б {preset.proteinPerKg} / Ж {preset.fatPerKg} на кг • У считаются по оставшимся калориям
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
        <div className="text-sm font-semibold text-slate-900">Свои Б/Ж/У на кг</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">
          Введите Б/Ж/У на кг, чтобы получить нужное количество калорий. Или введите калории, и Б/Ж/У заполнятся автоматически.
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-slate-600">
            Ккал на день
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={values.customKcalTarget}
              onChange={(event) => onChange({ customKcalTarget: event.target.value })}
            />
          </label>
          <div className="hidden sm:block" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <label className="text-sm font-medium text-slate-600">
            Б / кг
            <input
              className={inputClass}
              type="number"
              min="0.1"
              step="0.1"
              value={values.proteinPerKg}
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
              value={values.fatPerKg}
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
              value={values.carbsPerKg}
              onChange={(event) => onChange({ carbsPerKg: event.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
        <div className="text-sm font-semibold text-slate-900">Свои нутриенты на день</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-slate-600">
            Клетчатка, г
            <input
              className={inputClass}
              type="number"
              min="0.1"
              step="0.1"
              value={values.fiberTarget}
              onChange={(event) => onChange({ fiberTarget: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Магний, мг
            <input
              className={inputClass}
              type="number"
              min="0.1"
              step="0.1"
              value={values.magnesiumTarget}
              onChange={(event) => onChange({ magnesiumTarget: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Железо, мг
            <input
              className={inputClass}
              type="number"
              min="0.1"
              step="0.1"
              value={values.ironTarget}
              onChange={(event) => onChange({ ironTarget: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Цинк, мг
            <input
              className={inputClass}
              type="number"
              min="0.1"
              step="0.1"
              value={values.zincTarget}
              onChange={(event) => onChange({ zincTarget: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Омега-3, г
            <input
              className={inputClass}
              type="number"
              min="0.1"
              step="0.1"
              value={values.omega3Target}
              onChange={(event) => onChange({ omega3Target: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Витамин B12, мкг
            <input
              className={inputClass}
              type="number"
              min="0.1"
              step="0.1"
              value={values.vitaminB12Target}
              onChange={(event) => onChange({ vitaminB12Target: event.target.value })}
            />
          </label>
        </div>
      </div>
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
  preview: NutritionTotals;
  valid: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  const handleFormulaChange = (changes: Partial<FormulaValues>) => {
    const weight = sanitizeNumber(draft.weightKg, 0);
    const nextFormula = syncCustomFormulaValues(getDraftFormulaValues(draft), changes, weight);
    onChange({ ...draft, ...nextFormula });
  };

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
          placeholder="Рост, см"
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
          placeholder="Вес, кг"
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
          placeholder="Желаемый вес, кг"
        />
      </label>

      <FormulaModeSwitch value={draft.formulaMode} onChange={(formulaMode) => onChange(applyDraftMode(formulaMode, draft))} />

      <FormulaInputs
        mode={draft.formulaMode}
        values={getDraftFormulaValues(draft)}
        onChange={handleFormulaChange}
      />

      <SummaryPreview preview={preview} warning={getCustomDeficitWarning(getPreviewProfile(draft))} />

      <div className="flex items-center gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[1rem] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Закрыть
          </button>
        ) : null}
        <button
          type="button"
          disabled={!valid}
          onClick={onSubmit}
          className="theme-accent-button ml-auto rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          Сохранить профиль
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
  user: UserProfile;
  onUpdate: (changes: Partial<UserProfile>) => void;
  onDelete?: () => void;
}) {
  const [formulaOverrides, setFormulaOverrides] = useState<Partial<FormulaValues>>({});

  const handleModeChange = (formulaMode: FormulaMode) => {
    if (formulaMode !== "custom") {
      setFormulaOverrides({});
      onUpdate({ formulaMode });
      return;
    }

    const fallback = calculateTargets({ ...user, formulaMode: "maintain" });
    const coefficients = resolveProfileFormula(user);

    onUpdate({
      formulaMode,
      customKcalTarget: user.customKcalTarget ?? fallback.kcal,
      proteinPerKg: user.proteinPerKg || coefficients.proteinPerKg,
      fatPerKg: user.fatPerKg || coefficients.fatPerKg,
      carbsPerKg: user.carbsPerKg ?? coefficients.carbsPerKg,
      fiberTarget: user.fiberTarget ?? fallback.fiber,
      magnesiumTarget: user.magnesiumTarget ?? fallback.magnesium,
      ironTarget: user.ironTarget ?? fallback.iron,
      zincTarget: user.zincTarget ?? fallback.zinc,
      omega3Target: user.omega3Target ?? fallback.omega3,
      vitaminB12Target: user.vitaminB12Target ?? fallback.vitaminB12,
    });
    setFormulaOverrides({});
  };
  const formulaDraft = { ...getProfileFormulaValues(user), ...formulaOverrides };
  const handleFormulaInputChange = (changes: Partial<FormulaValues>) => {
    const weight = user.weightKg;
    const nextFormula = syncCustomFormulaValues(formulaDraft, changes, weight);
    setFormulaOverrides(nextFormula);
    onUpdate({
      customKcalTarget: getNumberOrNull(nextFormula.customKcalTarget),
      proteinPerKg: sanitizeNumber(nextFormula.proteinPerKg, user.proteinPerKg),
      fatPerKg: sanitizeNumber(nextFormula.fatPerKg, user.fatPerKg),
      carbsPerKg: sanitizeNumber(nextFormula.carbsPerKg, user.carbsPerKg),
      fiberTarget: changes.fiberTarget === undefined ? undefined : getNumberOrNull(nextFormula.fiberTarget),
      magnesiumTarget: changes.magnesiumTarget === undefined ? undefined : getNumberOrNull(nextFormula.magnesiumTarget),
      ironTarget: changes.ironTarget === undefined ? undefined : getNumberOrNull(nextFormula.ironTarget),
      zincTarget: changes.zincTarget === undefined ? undefined : getNumberOrNull(nextFormula.zincTarget),
      omega3Target: changes.omega3Target === undefined ? undefined : getNumberOrNull(nextFormula.omega3Target),
      vitaminB12Target:
        changes.vitaminB12Target === undefined ? undefined : getNumberOrNull(nextFormula.vitaminB12Target),
    });
  };

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

      <FormulaModeSwitch value={user.formulaMode} onChange={handleModeChange} />

      <FormulaInputs
        mode={user.formulaMode}
        values={formulaDraft}
        onChange={handleFormulaInputChange}
      />

      <SummaryPreview preview={calculateTargets(user)} warning={getCustomDeficitWarning(user)} />

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
  const draftPreview = useMemo(() => buildDraftPreview(draft), [draft]);
  const draftValid = useMemo(() => isDraftValid(draft), [draft]);
  const transferKey = useMemo(() => encodeTransferKey(buildTransferState(state)), [state]);

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Загружаю профиль...</div>;
  }

  const resetDraft = () => setDraft(emptyDraft);

  const saveNewProfile = () => {
    createProfile({
      name: draft.name.trim(),
      sex: draft.sex,
      age: sanitizeNumber(draft.age, 30),
      activityLevel: draft.activityLevel,
      heightCm: sanitizeNumber(draft.heightCm, 0),
      weightKg: sanitizeNumber(draft.weightKg, 0),
      goalWeightKg: sanitizeNumber(draft.goalWeightKg, 0),
      formulaMode: draft.formulaMode,
      customKcalTarget: getNumberOrNull(draft.customKcalTarget),
      proteinPerKg: sanitizeNumber(draft.proteinPerKg, FORMULA_PRESETS.maintain.proteinPerKg),
      fatPerKg: sanitizeNumber(draft.fatPerKg, FORMULA_PRESETS.maintain.fatPerKg),
      carbsPerKg: sanitizeNumber(draft.carbsPerKg, 0),
      fiberTarget: getNumberOrNull(draft.fiberTarget),
      magnesiumTarget: getNumberOrNull(draft.magnesiumTarget),
      ironTarget: getNumberOrNull(draft.ironTarget),
      zincTarget: getNumberOrNull(draft.zincTarget),
      omega3Target: getNumberOrNull(draft.omega3Target),
      vitaminB12Target: getNumberOrNull(draft.vitaminB12Target),
    });
    resetDraft();
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
      setTransferError("Ключ не подошел. Проверьте, что скопировали его полностью.");
    }
  };

  const copyTransferKey = async () => {
    try {
      await navigator.clipboard.writeText(transferKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      setTransferError("");
    } catch {
      setTransferError("Не получилось скопировать ключ. Попробуйте выделить его вручную.");
    }
  };

  if (!selectedUser) {
    return (
      <div className="space-y-4">
        <section className="app-card rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Профиль</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Создайте профиль или перенесите данные</h1>
          <p className="mt-2 text-sm text-slate-500">
            Можно начать с нового профиля или вставить ключ переноса, если данные уже есть в другом браузере.
          </p>

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
              <p className="mt-1 text-sm text-slate-600">
                Вставьте ключ из другого браузера, и приложение заменит текущие локальные данные.
              </p>
              <textarea
                value={transferKeyInput}
                onChange={(event) => setTransferKeyInput(event.target.value)}
                className={textAreaClass}
                placeholder="Вставьте ключ переноса"
              />
              {transferError ? (
                <div className="theme-status-warning mt-3 rounded-[1rem] px-4 py-3 text-sm">{transferError}</div>
              ) : null}
              <button
                type="button"
                onClick={importTransferKey}
                disabled={!transferKeyInput.trim()}
                className="theme-accent-button mt-4 rounded-[1rem] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                Загрузить данные
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
                  resetDraft();
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
              Цель {selectedUser.goalWeightKg ?? selectedUser.weightKg} кг •{" "}
              {activityTitles[selectedUser.activityLevel ?? "sedentary"]}
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
            <div className="mt-2 text-xs text-slate-500">{formulaTitles[selectedUser.formulaMode]}</div>
          </div>
          <div className="rounded-[1.25rem] bg-white px-4 py-4 text-sm text-slate-600">
            <div>Б {targets.protein}</div>
            <div className="mt-1">Ж {targets.fat}</div>
            <div className="mt-1">У {targets.carbs}</div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] bg-[var(--color-mint-soft)] px-4 py-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">{formulaTitles[selectedUser.formulaMode]}</div>
          <div className="mt-1">{formulaDescriptions[selectedUser.formulaMode]}</div>
          <div className="mt-2">
            Б {selectedFormula.proteinPerKg} / Ж {selectedFormula.fatPerKg} / У {selectedFormula.carbsPerKg} на кг
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Клетчатка {targets.fiber} г • Магний {targets.magnesium} мг • Железо {targets.iron} мг • Цинк{" "}
            {targets.zinc} мг
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Омега-3 {targets.omega3} г • B12 {targets.vitaminB12} мкг
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Перенос и сохранение данных</h2>
            <p className="mt-1 text-sm text-slate-500">
              Скопируйте ключ для другого браузера или скачайте backup-файл.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowTransferImport((value) => !value);
              setTransferError("");
            }}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {showTransferImport ? "Закрыть импорт" : "Вставить ключ переноса"}
          </button>
        </div>

        <textarea
          className={textAreaClass}
          value={transferKey}
          readOnly
          aria-label="Ключ переноса"
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyTransferKey}
            className="theme-accent-button rounded-[1rem] px-4 py-3 text-sm font-semibold"
          >
            {copied ? "Скопировано" : "Скопировать ключ"}
          </button>
          <button
            type="button"
            onClick={() => downloadStateBackup(buildTransferState(state))}
            className="rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Скачать backup
          </button>
        </div>

        {showTransferImport ? (
          <div className="mt-4 rounded-[1.35rem] bg-white px-4 py-4">
            <div className="text-sm font-semibold text-slate-900">Загрузить данные по ключу</div>
            <div className="mt-1 text-sm text-slate-500">
              Текущие локальные данные заменятся импортированными.
            </div>
            <textarea
              className={textAreaClass}
              placeholder="Вставьте сюда ключ переноса"
              value={transferKeyInput}
              onChange={(event) => {
                setTransferKeyInput(event.target.value);
                setTransferError("");
              }}
            />
            {transferError ? (
              <div className="theme-status-warning mt-3 rounded-[1rem] px-4 py-3 text-sm">{transferError}</div>
            ) : null}
            <button
              type="button"
              onClick={importTransferKey}
              disabled={!transferKeyInput.trim()}
              className="theme-accent-button mt-3 rounded-[1rem] px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Загрузить данные
            </button>
          </div>
        ) : null}
      </section>

      <section className="app-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Дополнительные профили</h2>
            <p className="mt-1 text-sm text-slate-500">Если нужно, можно хранить несколько профилей в одном приложении.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateProfile((value) => !value)}
            className="rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)]"
          >
            {showCreateProfile ? "Закрыть" : "Создать профиль"}
          </button>
        </div>

        {state.profiles.length > 1 ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowSwitcher((value) => !value)}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {showSwitcher ? "Скрыть список" : "Сменить профиль"}
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
                resetDraft();
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
