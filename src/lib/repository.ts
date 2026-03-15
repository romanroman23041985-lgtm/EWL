import { mergeBuiltInProducts } from "@/lib/base-products";
import { STORAGE_KEY } from "@/lib/constants";
import { buildSeedState } from "@/lib/seed";
import type { PersistedAppState } from "@/lib/types";

export interface AppRepository {
  load: () => Promise<PersistedAppState>;
  save: (state: PersistedAppState) => Promise<void>;
}

function isPersistedState(value: unknown): value is PersistedAppState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PersistedAppState;
  return Array.isArray(candidate.profiles) && Array.isArray(candidate.products);
}

export const localAppRepository: AppRepository = {
  async load() {
    if (typeof window === "undefined") {
      return buildSeedState();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildSeedState();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isPersistedState(parsed)) {
        return {
          ...parsed,
          products: mergeBuiltInProducts(parsed.products),
        };
      }
    } catch {
      return buildSeedState();
    }

    return buildSeedState();
  },
  async save(state) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
};
