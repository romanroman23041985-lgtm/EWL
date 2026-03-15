"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import { STATE_VERSION } from "@/lib/constants";
import { normalizeFormulaMode } from "@/lib/macros";
import { getAutoKcalFromDraft, parseDraftNumber } from "@/lib/products";
import { localAppRepository } from "@/lib/repository";
import type {
  CompanionState,
  FormulaMode,
  MealType,
  PersistedAppState,
  Product,
  ProductDraft,
  QuantityMode,
  Sex,
  ThemeMode,
  UserProfile,
} from "@/lib/types";

type HydratedState = PersistedAppState & {
  hydrated: boolean;
};

type ProfileInput = Pick<
  UserProfile,
  | "name"
  | "sex"
  | "heightCm"
  | "weightKg"
  | "goalWeightKg"
  | "formulaMode"
  | "proteinPerKg"
  | "fatPerKg"
  | "carbsPerKg"
>;

type ProductInput = {
  draft: ProductDraft;
};

type Action =
  | { type: "hydrate"; payload: PersistedAppState }
  | { type: "setThemeMode"; payload: ThemeMode }
  | { type: "updateCompanion"; payload: Partial<CompanionState> }
  | { type: "setSelectedUser"; payload: string }
  | {
      type: "addMealItem";
      payload: {
        userId: string;
        date: string;
        mealType: MealType;
        mealLabel?: string;
        productId: string;
        grams: number;
        quantityMode?: QuantityMode;
        servings?: number | null;
      };
    }
  | {
      type: "updateMealItem";
      payload: {
        itemId: string;
        grams?: number;
        mealType?: MealType;
        mealLabel?: string;
        quantityMode?: QuantityMode;
        servings?: number | null;
      };
    }
  | { type: "deleteMealItem"; payload: { itemId: string } }
  | { type: "createProfile"; payload: ProfileInput }
  | { type: "updateProfile"; payload: { userId: string; changes: Partial<ProfileInput> } }
  | { type: "deleteProfile"; payload: { userId: string } }
  | { type: "createProduct"; payload: ProductInput }
  | { type: "updateProduct"; payload: { productId: string; draft: ProductDraft } }
  | { type: "deleteProduct"; payload: { productId: string } };

function createEmptyState(): HydratedState {
  return {
    version: STATE_VERSION,
    themeMode: "rose",
    companion: {
      unlockedAchievementIds: [],
      mascotMode: "default",
      lastMessageKey: null,
      lastMessageAt: null,
      lastMessageText: null,
      lastMessageMood: null,
    },
    selectedUserId: "",
    profiles: [],
    products: [],
    dayEntries: [],
    mealItems: [],
    recentProductsByUser: {},
    hydrated: false,
  };
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeState(payload: PersistedAppState): PersistedAppState {
  return {
    ...payload,
    themeMode: payload.themeMode === "beige" ? "beige" : "rose",
    companion: {
      unlockedAchievementIds: payload.companion?.unlockedAchievementIds ?? [],
      mascotMode: payload.companion?.mascotMode === "overeating" ? "overeating" : "default",
      lastMessageKey: payload.companion?.lastMessageKey ?? null,
      lastMessageAt: payload.companion?.lastMessageAt ?? null,
      lastMessageText: payload.companion?.lastMessageText ?? null,
      lastMessageMood: payload.companion?.lastMessageMood ?? null,
    },
    recentProductsByUser: payload.recentProductsByUser ?? {},
    profiles: payload.profiles.map((profile) => ({
      ...profile,
      formulaMode: normalizeFormulaMode(profile.formulaMode),
      heightCm: profile.heightCm ?? null,
      goalWeightKg: profile.goalWeightKg ?? profile.weightKg,
    })),
    products: payload.products.map((product) => ({
      ...product,
      unitMode: product.unitMode === "piece" ? "piece" : "grams",
      unitLabel: product.unitLabel ?? "",
      gramsPerUnit: product.gramsPerUnit ?? null,
      searchTerms: product.searchTerms ?? [],
      archivedAt: product.archivedAt ?? null,
    })),
    mealItems: payload.mealItems.map((item) => ({
      ...item,
      mealLabel: item.mealLabel ?? "",
      quantityMode: item.quantityMode === "piece" ? "piece" : "grams",
      servings: item.servings ?? null,
    })),
  };
}

function toProductEntity(draft: ProductDraft, existing?: Product): Product {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId("product"),
    name: draft.name.trim(),
    icon: draft.icon.trim() || undefined,
    searchTerms: existing?.searchTerms ?? [],
    proteinPer100: parseDraftNumber(draft.proteinPer100) ?? 0,
    fatPer100: parseDraftNumber(draft.fatPer100) ?? 0,
    carbsPer100: parseDraftNumber(draft.carbsPer100) ?? 0,
    kcalPer100: draft.kcalPer100.trim()
      ? (parseDraftNumber(draft.kcalPer100) ?? getAutoKcalFromDraft(draft))
      : getAutoKcalFromDraft(draft),
    unitMode: draft.unitMode,
    unitLabel: draft.unitMode === "piece" ? draft.unitLabel.trim() : "",
    gramsPerUnit: draft.unitMode === "piece" ? (parseDraftNumber(draft.gramsPerUnit) ?? null) : null,
    isCustom: true,
    archivedAt: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function updateRecentProducts(
  recentProductsByUser: Record<string, string[]>,
  userId: string,
  productId: string,
) {
  const current = recentProductsByUser[userId] ?? [];
  return {
    ...recentProductsByUser,
    [userId]: [productId, ...current.filter((currentProductId) => currentProductId !== productId)].slice(0, 8),
  };
}

function ensureDayEntry(state: HydratedState, userId: string, date: string) {
  const existing = state.dayEntries.find((entry) => entry.userId === userId && entry.date === date);
  if (existing) {
    return { dayEntries: state.dayEntries, dayEntryId: existing.id };
  }

  const now = new Date().toISOString();
  const newEntry = {
    id: createId("day"),
    userId,
    date,
    createdAt: now,
    updatedAt: now,
  };

  return {
    dayEntries: [...state.dayEntries, newEntry],
    dayEntryId: newEntry.id,
  };
}

function reducer(state: HydratedState, action: Action): HydratedState {
  switch (action.type) {
    case "hydrate":
      return {
        ...normalizeState(action.payload),
        hydrated: true,
      };
    case "setThemeMode":
      return {
        ...state,
        themeMode: action.payload,
      };
    case "updateCompanion":
      return {
        ...state,
        companion: {
          ...state.companion,
          ...action.payload,
          unlockedAchievementIds: action.payload.unlockedAchievementIds ?? state.companion.unlockedAchievementIds,
        },
      };
    case "setSelectedUser":
      return {
        ...state,
        selectedUserId: action.payload,
      };
    case "addMealItem": {
      const { userId, date, mealType, mealLabel, productId, grams, quantityMode, servings } = action.payload;
      const ensured = ensureDayEntry(state, userId, date);
      const nextOrder =
        state.mealItems
          .filter((item) => item.dayEntryId === ensured.dayEntryId && item.mealType === mealType)
          .reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;

      return {
        ...state,
        dayEntries: ensured.dayEntries.map((entry) =>
          entry.id === ensured.dayEntryId ? { ...entry, updatedAt: new Date().toISOString() } : entry,
        ),
        mealItems: [
          ...state.mealItems,
          {
            id: createId("meal"),
            dayEntryId: ensured.dayEntryId,
            mealType,
            mealLabel: mealLabel ?? "",
            productId,
            grams,
            quantityMode: quantityMode ?? "grams",
            servings: servings ?? null,
            sortOrder: nextOrder,
          },
        ],
        recentProductsByUser: updateRecentProducts(state.recentProductsByUser, userId, productId),
      };
    }
    case "updateMealItem": {
      const item = state.mealItems.find((candidate) => candidate.id === action.payload.itemId);
      if (!item) {
        return state;
      }

      return {
        ...state,
        dayEntries: state.dayEntries.map((entry) =>
          entry.id === item.dayEntryId ? { ...entry, updatedAt: new Date().toISOString() } : entry,
        ),
        mealItems: state.mealItems.map((candidate) =>
          candidate.id === action.payload.itemId
            ? {
                ...candidate,
                grams: action.payload.grams ?? candidate.grams,
                mealType: action.payload.mealType ?? candidate.mealType,
                mealLabel: action.payload.mealLabel ?? candidate.mealLabel ?? "",
                quantityMode: action.payload.quantityMode ?? candidate.quantityMode ?? "grams",
                servings:
                  action.payload.servings === undefined ? (candidate.servings ?? null) : action.payload.servings,
              }
            : candidate,
        ),
      };
    }
    case "deleteMealItem": {
      const item = state.mealItems.find((candidate) => candidate.id === action.payload.itemId);
      if (!item) {
        return state;
      }

      return {
        ...state,
        dayEntries: state.dayEntries.map((entry) =>
          entry.id === item.dayEntryId ? { ...entry, updatedAt: new Date().toISOString() } : entry,
        ),
        mealItems: state.mealItems.filter((candidate) => candidate.id !== action.payload.itemId),
      };
    }
    case "createProfile": {
      const now = new Date().toISOString();
      const profile = {
        id: createId("profile"),
        ...action.payload,
        formulaMode: normalizeFormulaMode(action.payload.formulaMode),
        heightCm: action.payload.heightCm ?? null,
        goalWeightKg: action.payload.goalWeightKg ?? action.payload.weightKg,
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...state,
        profiles: [...state.profiles, profile],
        selectedUserId: profile.id,
      };
    }
    case "updateProfile":
      return {
        ...state,
        profiles: state.profiles.map((profile) =>
          profile.id === action.payload.userId
            ? {
                ...profile,
                ...action.payload.changes,
                updatedAt: new Date().toISOString(),
              }
            : profile,
        ),
      };
    case "deleteProfile": {
      if (state.profiles.length <= 1) {
        return state;
      }

      const removedIds = new Set(
        state.dayEntries.filter((entry) => entry.userId === action.payload.userId).map((entry) => entry.id),
      );
      const profiles = state.profiles.filter((profile) => profile.id !== action.payload.userId);
      const { [action.payload.userId]: removedRecentProducts, ...recentProductsByUser } =
        state.recentProductsByUser;
      void removedRecentProducts;

      return {
        ...state,
        profiles,
        selectedUserId:
          state.selectedUserId === action.payload.userId ? (profiles[0]?.id ?? "") : state.selectedUserId,
        dayEntries: state.dayEntries.filter((entry) => entry.userId !== action.payload.userId),
        mealItems: state.mealItems.filter((item) => !removedIds.has(item.dayEntryId)),
        recentProductsByUser,
      };
    }
    case "createProduct": {
      const product = toProductEntity(action.payload.draft);

      return {
        ...state,
        products: [...state.products, product],
      };
    }
    case "updateProduct": {
      const existing = state.products.find((product) => product.id === action.payload.productId);
      if (!existing) {
        return state;
      }

      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.productId ? toProductEntity(action.payload.draft, existing) : product,
        ),
      };
    }
    case "deleteProduct": {
      const existing = state.products.find((product) => product.id === action.payload.productId);
      if (!existing) {
        return state;
      }

      const wasUsed = state.mealItems.some((item) => item.productId === action.payload.productId);
      const shouldArchive = wasUsed || !existing.isCustom;
      const nextProducts = shouldArchive
        ? state.products.map((product) =>
            product.id === action.payload.productId
              ? {
                  ...product,
                  archivedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : product,
          )
        : state.products.filter((product) => product.id !== action.payload.productId);

      const nextRecentProductsByUser = Object.fromEntries(
        Object.entries(state.recentProductsByUser).map(([userId, productIds]) => [
          userId,
          productIds.filter((productId) => productId !== action.payload.productId),
        ]),
      );

      return {
        ...state,
        products: nextProducts,
        recentProductsByUser: nextRecentProductsByUser,
      };
    }
    default:
      return state;
  }
}

type StoreValue = {
  state: HydratedState;
  setThemeMode: (themeMode: ThemeMode) => void;
  updateCompanion: (payload: Partial<CompanionState>) => void;
  setSelectedUser: (userId: string) => void;
  addMealItem: (payload: {
    userId: string;
    date: string;
    mealType: MealType;
    mealLabel?: string;
    productId: string;
    grams: number;
    quantityMode?: QuantityMode;
    servings?: number | null;
  }) => void;
  updateMealItem: (payload: {
    itemId: string;
    grams?: number;
    mealType?: MealType;
    mealLabel?: string;
    quantityMode?: QuantityMode;
    servings?: number | null;
  }) => void;
  deleteMealItem: (itemId: string) => void;
  createProfile: (payload: ProfileInput) => void;
  updateProfile: (userId: string, changes: Partial<ProfileInput>) => void;
  deleteProfile: (userId: string) => void;
  createProduct: (draft: ProductDraft) => void;
  updateProduct: (productId: string, draft: ProductDraft) => void;
  deleteProduct: (productId: string) => void;
};

const AppStoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(reducer, undefined, createEmptyState);

  useEffect(() => {
    let active = true;

    void localAppRepository.load().then((payload) => {
      if (active) {
        dispatch({ type: "hydrate", payload });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    void localAppRepository.save({
      version: state.version,
      themeMode: state.themeMode,
      companion: state.companion,
      selectedUserId: state.selectedUserId,
      profiles: state.profiles,
      products: state.products,
      dayEntries: state.dayEntries,
      mealItems: state.mealItems,
      recentProductsByUser: state.recentProductsByUser,
    });
  }, [state]);

  return (
    <AppStoreContext.Provider
      value={{
        state,
        setThemeMode: (themeMode) => dispatch({ type: "setThemeMode", payload: themeMode }),
        updateCompanion: (payload) => dispatch({ type: "updateCompanion", payload }),
        setSelectedUser: (userId) => dispatch({ type: "setSelectedUser", payload: userId }),
        addMealItem: (payload) => dispatch({ type: "addMealItem", payload }),
        updateMealItem: (payload) => dispatch({ type: "updateMealItem", payload }),
        deleteMealItem: (itemId) => dispatch({ type: "deleteMealItem", payload: { itemId } }),
        createProfile: (payload) => dispatch({ type: "createProfile", payload }),
        updateProfile: (userId, changes) => dispatch({ type: "updateProfile", payload: { userId, changes } }),
        deleteProfile: (userId) => dispatch({ type: "deleteProfile", payload: { userId } }),
        createProduct: (draft) => dispatch({ type: "createProduct", payload: { draft } }),
        updateProduct: (productId, draft) => dispatch({ type: "updateProduct", payload: { productId, draft } }),
        deleteProduct: (productId) => dispatch({ type: "deleteProduct", payload: { productId } }),
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used inside AppStoreProvider");
  }

  return context;
}

export function sanitizeNumber(value: string, fallback = 0) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function sexLabel(sex: Sex) {
  return sex === "female" ? "Женский" : "Мужской";
}

export function formulaLabel(mode: FormulaMode) {
  if (mode === "lose") {
    return "Похудение";
  }

  if (mode === "gain") {
    return "Набор массы";
  }

  if (mode === "custom") {
    return "Своя";
  }

  return "Поддержание";
}
