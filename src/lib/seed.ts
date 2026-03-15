import { buildBaseProducts } from "@/lib/base-products";
import { STATE_VERSION } from "@/lib/constants";
import type { PersistedAppState } from "@/lib/types";

export function buildSeedState(): PersistedAppState {
  return {
    version: STATE_VERSION,
    themeMode: "rose",
    companion: {
      unlockedAchievementIds: [],
      mascotMode: "default",
      lastWeeklyRecapKey: null,
      lastMessageKey: null,
      lastMessageAt: null,
      lastMessageText: null,
      lastMessageMood: null,
    },
    selectedUserId: "",
    profiles: [],
    products: buildBaseProducts(),
    dayEntries: [],
    mealItems: [],
    recentProductsByUser: {},
  };
}
