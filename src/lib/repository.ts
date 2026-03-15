import { mergeBuiltInProducts } from "@/lib/base-products";
import { BACKUP_STORAGE_KEY, MAX_LOCAL_BACKUPS, STATE_VERSION, STORAGE_KEY } from "@/lib/constants";
import { normalizeFormulaMode } from "@/lib/macros";
import { buildSeedState } from "@/lib/seed";
import type { PersistedAppState } from "@/lib/types";

export interface AppRepository {
  load: () => Promise<PersistedAppState>;
  save: (state: PersistedAppState) => Promise<void>;
}

type BackupSnapshot = {
  id: string;
  dayKey: string;
  createdAt: string;
  state: PersistedAppState;
};

function isPersistedState(value: unknown): value is PersistedAppState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PersistedAppState;
  return Array.isArray(candidate.profiles) && Array.isArray(candidate.products);
}

function isLikelyDemoState(state: PersistedAppState) {
  const profileIds = state.profiles.map((profile) => profile.id).sort();
  const demoProfiles = profileIds.length === 2 && profileIds[0] === "profile-anna" && profileIds[1] === "profile-max";
  const demoDays = state.dayEntries.every((entry) => entry.userId === "profile-anna");
  const demoItems = state.mealItems.every((item) => item.id.startsWith("meal-"));
  return demoProfiles && demoDays && demoItems;
}

function migrateState(state: PersistedAppState): PersistedAppState {
  if ((state.version ?? 0) < STATE_VERSION && isLikelyDemoState(state)) {
    return buildSeedState();
  }

  return {
    ...state,
    version: STATE_VERSION,
    themeMode: state.themeMode === "beige" ? "beige" : "rose",
    companion: {
      unlockedAchievementIds: state.companion?.unlockedAchievementIds ?? [],
      mascotMode: state.companion?.mascotMode === "overeating" ? "overeating" : "default",
      lastMessageKey: state.companion?.lastMessageKey ?? null,
      lastMessageAt: state.companion?.lastMessageAt ?? null,
      lastMessageText: state.companion?.lastMessageText ?? null,
      lastMessageMood: state.companion?.lastMessageMood ?? null,
    },
    products: mergeBuiltInProducts(state.products),
    profiles: state.profiles.map((profile) => ({
      ...profile,
      formulaMode: normalizeFormulaMode(profile.formulaMode),
      heightCm: profile.heightCm ?? null,
      goalWeightKg: profile.goalWeightKg ?? profile.weightKg,
    })),
  };
}

function readBackupSnapshots() {
  if (typeof window === "undefined") {
    return [] as BackupSnapshot[];
  }

  try {
    const raw = window.localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is BackupSnapshot => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as BackupSnapshot;
      return Boolean(candidate.id && candidate.dayKey && candidate.createdAt && isPersistedState(candidate.state));
    });
  } catch {
    return [];
  }
}

function getBackupState(state: PersistedAppState): PersistedAppState {
  return {
    ...state,
    products: state.products.filter((product) => product.isCustom || product.archivedAt),
  };
}

function saveBackupSnapshot(state: PersistedAppState) {
  if (typeof window === "undefined") {
    return;
  }

  const createdAt = new Date().toISOString();
  const dayKey = createdAt.slice(0, 10);
  const nextSnapshot: BackupSnapshot = {
    id: `backup-${dayKey}`,
    dayKey,
    createdAt,
    state: getBackupState(state),
  };

  const existing = readBackupSnapshots().filter((snapshot) => snapshot.dayKey !== dayKey);
  const nextSnapshots = [nextSnapshot, ...existing].slice(0, MAX_LOCAL_BACKUPS);
  window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(nextSnapshots));
}

function getLatestBackupState() {
  const [latest] = readBackupSnapshots();
  return latest?.state ?? null;
}

export const localAppRepository: AppRepository = {
  async load() {
    if (typeof window === "undefined") {
      return buildSeedState();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const backupState = getLatestBackupState();
      return backupState ? migrateState(backupState) : buildSeedState();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isPersistedState(parsed)) {
        return migrateState(parsed);
      }
    } catch {
      const backupState = getLatestBackupState();
      return backupState ? migrateState(backupState) : buildSeedState();
    }

    const backupState = getLatestBackupState();
    return backupState ? migrateState(backupState) : buildSeedState();
  },
  async save(state) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveBackupSnapshot(state);
  },
};
