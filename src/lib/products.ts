import { roundKcal } from "@/lib/macros";
import type {
  MealItem,
  Product,
  ProductDraft,
  ProductNutritionInputMode,
  QuantityMode,
} from "@/lib/types";

export function getProductInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function getVisibleProducts(products: Product[]) {
  const deduped = new Map<string, Product>();

  for (const product of products) {
    if (product.archivedAt) {
      continue;
    }

    const key = getProductDedupKey(product);
    const existing = deduped.get(key);

    if (!existing || compareProductPriority(product, existing) > 0) {
      deduped.set(key, product);
    }
  }

  return [...deduped.values()];
}

export function rankProducts(products: Product[], query: string) {
  const normalized = normalizeSearchValue(query);
  const raw = query.trim().toLowerCase();
  const compactQuery = collapseSearchValue(query);

  if (!normalized) {
    return getVisibleProducts(products).sort((left, right) => left.name.localeCompare(right.name, "ru"));
  }

  return getVisibleProducts(products)
    .filter((product) =>
      getSearchableVariants(product).some((value) => {
        const lowered = value.toLowerCase();
        const compactValue = collapseSearchValue(value);
        return lowered.includes(raw) || value.includes(normalized) || compactValue.includes(compactQuery);
      }),
    )
    .sort((left, right) => {
      const leftScore = Math.max(...getSearchableVariants(left).map((value) => getSearchScore(value, normalized)));
      const rightScore = Math.max(...getSearchableVariants(right).map((value) => getSearchScore(value, normalized)));

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return left.name.localeCompare(right.name, "ru");
    });
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[()\-.,/%]/g, " ")
    .replace(/\s+/g, " ");
}

function collapseSearchValue(value: string) {
  return normalizeSearchValue(value).replace(/\s+/g, "");
}

function normalizeDedupName(value: string) {
  const normalized = normalizeSearchValue(value)
    .replace(/\b100\s*г\b/g, "")
    .replace(/\b(\d+)\s*шт\b/g, "")
    .trim();

  const aliases = new Map<string, string>([
    ["бананы", "банан"],
    ["яблоки", "яблоко"],
    ["огурцы", "огурец"],
    ["помидоры", "помидор"],
    ["томаты", "помидор"],
    ["яйца", "яйцо"],
    ["яйцо куриное", "яйцо"],
    ["чоко пай", "чокопай"],
  ]);

  return aliases.get(normalized) ?? normalized;
}

export function getProductCategoryKey(product: Product) {
  const source = `${product.name} ${product.notes ?? ""} ${(product.searchTerms ?? []).join(" ")}`.toLowerCase().replaceAll("ё", "е");

  if (
    source.includes("банан") ||
    source.includes("яблок") ||
    source.includes("груш") ||
    source.includes("апельс") ||
    source.includes("мандари") ||
    source.includes("киви") ||
    source.includes("ягод") ||
    source.includes("фрукт")
  ) {
    return "fruit";
  }

  if (
    source.includes("овощ") ||
    source.includes("огур") ||
    source.includes("помид") ||
    source.includes("салат") ||
    source.includes("морков") ||
    source.includes("капуст") ||
    source.includes("перец")
  ) {
    return "vegetable";
  }

  if (source.includes("яйц")) {
    return "egg";
  }

  if (
    source.includes("молок") ||
    source.includes("сыр") ||
    source.includes("твор") ||
    source.includes("кеф") ||
    source.includes("йогур") ||
    source.includes("смет")
  ) {
    return "dairy";
  }

  if (
    source.includes("лосос") ||
    source.includes("тунец") ||
    source.includes("рыб") ||
    source.includes("селед") ||
    source.includes("сельд") ||
    source.includes("кревет")
  ) {
    return "fish";
  }

  if (
    source.includes("кур") ||
    source.includes("индей") ||
    source.includes("говя") ||
    source.includes("свин") ||
    source.includes("мяс") ||
    source.includes("ветчин") ||
    source.includes("колбас") ||
    source.includes("сосиск")
  ) {
    return "meat";
  }

  if (
    source.includes("рис") ||
    source.includes("греч") ||
    source.includes("овся") ||
    source.includes("круп") ||
    source.includes("макарон") ||
    source.includes("булгур") ||
    source.includes("нут") ||
    source.includes("чечев") ||
    source.includes("фасол")
  ) {
    return "grain";
  }

  if (source.includes("хлеб") || source.includes("тост") || source.includes("лаваш") || source.includes("булк")) {
    return "bread";
  }

  if (source.includes("масл")) {
    return "fat";
  }

  if (
    source.includes("орех") ||
    source.includes("миндал") ||
    source.includes("фисташ") ||
    source.includes("арахис") ||
    source.includes("семеч")
  ) {
    return "nuts";
  }

  if (source.includes("кофе") || source.includes("чай") || source.includes("сок") || source.includes("напит")) {
    return "drink";
  }

  if (
    source.includes("шокол") ||
    source.includes("конф") ||
    source.includes("слад") ||
    source.includes("чоко") ||
    source.includes("торт") ||
    source.includes("печен") ||
    source.includes("пирож")
  ) {
    return "sweet";
  }

  return "neutral";
}

function getProductDedupKey(product: Product) {
  return `${getProductCategoryKey(product)}:${normalizeDedupName(product.name)}`;
}

function compareProductPriority(left: Product, right: Product) {
  const leftScore =
    (left.isCustom ? 1000 : 0) +
    (left.icon?.trim() ? 100 : 0) +
    ((left.searchTerms?.length ?? 0) * 10) +
    (left.notes?.trim() ? 4 : 0) +
    (left.fiberPer100 || left.magnesiumPer100 || left.ironPer100 || left.zincPer100 || left.omega3Per100 || left.vitaminB12Per100 ? 8 : 0) -
    left.name.length / 100;

  const rightScore =
    (right.isCustom ? 1000 : 0) +
    (right.icon?.trim() ? 100 : 0) +
    ((right.searchTerms?.length ?? 0) * 10) +
    (right.notes?.trim() ? 4 : 0) +
    (right.fiberPer100 || right.magnesiumPer100 || right.ironPer100 || right.zincPer100 || right.omega3Per100 || right.vitaminB12Per100 ? 8 : 0) -
    right.name.length / 100;

  return leftScore - rightScore;
}

function getAliasTerms(product: Product) {
  const source = `${product.name} ${(product.searchTerms ?? []).join(" ")}`.toLowerCase();
  const aliases: string[] = [];

  if (source.includes("курин")) {
    aliases.push("курочка");
  }

  if (source.includes("чоко пай") || source.includes("choco pie")) {
    aliases.push("чокопай");
  }

  if (source.includes("пиц")) {
    aliases.push("пицца");
  }

  if (source.includes("творог")) {
    aliases.push("творожок");
  }

  return aliases;
}

function getSearchableVariants(product: Product) {
  const values = [product.name, ...(product.searchTerms ?? []), ...getAliasTerms(product)];
  return values.flatMap((value) => {
    const normalized = normalizeSearchValue(value);
    const compact = collapseSearchValue(value);
    return compact && compact !== normalized ? [normalized, compact] : [normalized];
  });
}

function getSearchScore(name: string, query: string) {
  if (name === query) {
    return 4;
  }

  if (name.startsWith(query)) {
    return 3;
  }

  if (name.split(/\s+/).some((part) => part.startsWith(query))) {
    return 2;
  }

  return 1;
}

function toPerUnitValue(value: number | null | undefined, gramsPerUnit: number | null | undefined) {
  if (!gramsPerUnit || gramsPerUnit <= 0) {
    return "";
  }

  const perUnit = (value ?? 0) * (gramsPerUnit / 100);
  return perUnit ? String(Math.round(perUnit * 10) / 10) : "";
}

export function toProductDraft(product?: Product): ProductDraft {
  const nutritionInputMode: ProductNutritionInputMode = "per100";

  return {
    name: product?.name ?? "",
    icon: product?.icon ?? "",
    nutritionInputMode,
    proteinPer100: product ? String(product.proteinPer100) : "",
    fatPer100: product ? String(product.fatPer100) : "",
    carbsPer100: product ? String(product.carbsPer100) : "",
    kcalPer100: product?.kcalPer100 ? String(product.kcalPer100) : "",
    fiberPer100: product?.fiberPer100 ? String(product.fiberPer100) : "",
    magnesiumPer100: product?.magnesiumPer100 ? String(product.magnesiumPer100) : "",
    ironPer100: product?.ironPer100 ? String(product.ironPer100) : "",
    zincPer100: product?.zincPer100 ? String(product.zincPer100) : "",
    omega3Per100: product?.omega3Per100 ? String(product.omega3Per100) : "",
    vitaminB12Per100: product?.vitaminB12Per100 ? String(product.vitaminB12Per100) : "",
    unitMode: getProductQuantityMode(product),
    unitLabel: product?.unitLabel ?? "",
    gramsPerUnit: product?.gramsPerUnit ? String(product.gramsPerUnit) : "",
  };
}

export function parseDraftNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function convertInputToPer100(value: string, draft: ProductDraft) {
  const parsed = parseDraftNumber(value);
  if (parsed === null) {
    return null;
  }

  if (draft.nutritionInputMode !== "perUnit") {
    return parsed;
  }

  const gramsPerUnit = parseDraftNumber(draft.gramsPerUnit);
  if (gramsPerUnit === null || gramsPerUnit <= 0) {
    return null;
  }

  return (parsed / gramsPerUnit) * 100;
}

export function getDraftNutritionPer100(draft: ProductDraft) {
  return {
    protein: convertInputToPer100(draft.proteinPer100, draft) ?? 0,
    fat: convertInputToPer100(draft.fatPer100, draft) ?? 0,
    carbs: convertInputToPer100(draft.carbsPer100, draft) ?? 0,
    kcal: draft.kcalPer100.trim() ? convertInputToPer100(draft.kcalPer100, draft) : null,
    fiber: convertInputToPer100(draft.fiberPer100, draft) ?? 0,
    magnesium: convertInputToPer100(draft.magnesiumPer100, draft) ?? 0,
    iron: convertInputToPer100(draft.ironPer100, draft) ?? 0,
    zinc: convertInputToPer100(draft.zincPer100, draft) ?? 0,
    omega3: convertInputToPer100(draft.omega3Per100, draft) ?? 0,
    vitaminB12: convertInputToPer100(draft.vitaminB12Per100, draft) ?? 0,
  };
}

export function getAutoKcalFromDraft(draft: ProductDraft) {
  const values = getDraftNutritionPer100(draft);
  return roundKcal(values.protein * 4 + values.fat * 9 + values.carbs * 4);
}

export function getProductQuantityMode(product?: Product): QuantityMode {
  return product?.unitMode === "piece" && (product.gramsPerUnit ?? 0) > 0 ? "piece" : "grams";
}

export function getProductUnitLabel(product?: Product) {
  if (getProductQuantityMode(product) === "piece") {
    return product?.unitLabel?.trim() || "шт.";
  }

  return "г";
}

export function getDefaultProductAmount(product?: Product) {
  return getProductQuantityMode(product) === "piece" ? "1" : "100";
}

export function formatAmountValue(value: number) {
  const normalized = Math.round(value * 10) / 10;
  return Number.isInteger(normalized) ? String(normalized) : String(normalized);
}

export function getMealItemAmount(product: Product, item: MealItem) {
  if (getProductQuantityMode(product) === "piece") {
    if (typeof item.servings === "number" && item.servings > 0) {
      return Math.round(item.servings * 10) / 10;
    }

    if ((product.gramsPerUnit ?? 0) > 0) {
      return Math.round((item.grams / (product.gramsPerUnit ?? 1)) * 10) / 10;
    }
  }

  return item.grams;
}

export function toMealItemQuantity(product: Product, amount: number) {
  if (getProductQuantityMode(product) === "piece") {
    const servings = Math.max(0.1, Math.round(amount * 10) / 10);

    return {
      quantityMode: "piece" as const,
      servings,
      grams: Math.max(1, Math.round(servings * (product.gramsPerUnit ?? 0))),
    };
  }

  return {
    quantityMode: "grams" as const,
    servings: null,
    grams: Math.max(1, Math.round(amount)),
  };
}

export function formatMealItemQuantity(product: Product, item: MealItem) {
  return `${formatAmountValue(getMealItemAmount(product, item))} ${getProductUnitLabel(product)}`;
}

export function validateProductDraft(draft: ProductDraft) {
  const values = getDraftNutritionPer100(draft);
  const kcal = draft.kcalPer100.trim() ? values.kcal : getAutoKcalFromDraft(draft);
  const gramsPerUnit = draft.gramsPerUnit.trim() ? parseDraftNumber(draft.gramsPerUnit) : null;

  if (!draft.name.trim()) {
    return { valid: false, message: "Введите название продукта." };
  }

  if (values.protein < 0 || values.fat < 0 || values.carbs < 0) {
    return { valid: false, message: "Проверьте БЖУ продукта." };
  }

  if (draft.nutritionInputMode === "perUnit" && (gramsPerUnit === null || gramsPerUnit <= 0)) {
    return { valid: false, message: "Для ввода за 1 шт укажите вес одной штуки в граммах." };
  }

  if (kcal === null || kcal < 0) {
    return { valid: false, message: "Проверьте калории." };
  }

  if (draft.unitMode === "piece") {
    if (!draft.unitLabel.trim()) {
      return { valid: false, message: "Для продукта по штукам укажите единицу." };
    }

    if (gramsPerUnit === null || gramsPerUnit <= 0) {
      return { valid: false, message: "Укажите, сколько граммов в одной штуке." };
    }
  }

  return { valid: true, message: "" };
}

export function switchDraftNutritionInputMode(
  product: Product | undefined,
  draft: ProductDraft,
  nextMode: ProductNutritionInputMode,
): ProductDraft {
  if (nextMode === draft.nutritionInputMode) {
    return draft;
  }

  const gramsPerUnit = parseDraftNumber(draft.gramsPerUnit) ?? product?.gramsPerUnit ?? null;

  if (nextMode === "per100") {
    const normalized = getDraftNutritionPer100(draft);
    return {
      ...draft,
      nutritionInputMode: nextMode,
      proteinPer100: String(normalized.protein),
      fatPer100: String(normalized.fat),
      carbsPer100: String(normalized.carbs),
      kcalPer100: normalized.kcal ? String(Math.round(normalized.kcal)) : "",
      fiberPer100: normalized.fiber ? String(normalized.fiber) : "",
      magnesiumPer100: normalized.magnesium ? String(normalized.magnesium) : "",
      ironPer100: normalized.iron ? String(normalized.iron) : "",
      zincPer100: normalized.zinc ? String(normalized.zinc) : "",
      omega3Per100: normalized.omega3 ? String(normalized.omega3) : "",
      vitaminB12Per100: normalized.vitaminB12 ? String(normalized.vitaminB12) : "",
    };
  }

  return {
    ...draft,
    nutritionInputMode: nextMode,
    proteinPer100: toPerUnitValue(parseDraftNumber(draft.proteinPer100), gramsPerUnit),
    fatPer100: toPerUnitValue(parseDraftNumber(draft.fatPer100), gramsPerUnit),
    carbsPer100: toPerUnitValue(parseDraftNumber(draft.carbsPer100), gramsPerUnit),
    kcalPer100: toPerUnitValue(parseDraftNumber(draft.kcalPer100), gramsPerUnit),
    fiberPer100: toPerUnitValue(parseDraftNumber(draft.fiberPer100), gramsPerUnit),
    magnesiumPer100: toPerUnitValue(parseDraftNumber(draft.magnesiumPer100), gramsPerUnit),
    ironPer100: toPerUnitValue(parseDraftNumber(draft.ironPer100), gramsPerUnit),
    zincPer100: toPerUnitValue(parseDraftNumber(draft.zincPer100), gramsPerUnit),
    omega3Per100: toPerUnitValue(parseDraftNumber(draft.omega3Per100), gramsPerUnit),
    vitaminB12Per100: toPerUnitValue(parseDraftNumber(draft.vitaminB12Per100), gramsPerUnit),
  };
}
