import { roundKcal } from "@/lib/macros";
import type { MealItem, Product, ProductDraft, QuantityMode } from "@/lib/types";

export function getProductInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function getVisibleProducts(products: Product[]) {
  return products.filter((product) => !product.archivedAt);
}

export function rankProducts(products: Product[], query: string) {
  const normalized = normalizeSearchValue(query);
  if (!normalized) {
    return getVisibleProducts(products).sort((left, right) => left.name.localeCompare(right.name, "ru"));
  }

  return getVisibleProducts(products)
    .filter((product) => getSearchableVariants(product).some((value) => value.includes(normalized)))
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

export function toProductDraft(product?: Product): ProductDraft {
  return {
    name: product?.name ?? "",
    icon: product?.icon ?? "",
    proteinPer100: product ? String(product.proteinPer100) : "",
    fatPer100: product ? String(product.fatPer100) : "",
    carbsPer100: product ? String(product.carbsPer100) : "",
    kcalPer100: product?.kcalPer100 ? String(product.kcalPer100) : "",
    unitMode: getProductQuantityMode(product),
    unitLabel: product?.unitLabel ?? "",
    gramsPerUnit: product?.gramsPerUnit ? String(product.gramsPerUnit) : "",
  };
}

export function parseDraftNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAutoKcalFromDraft(draft: ProductDraft) {
  const protein = parseDraftNumber(draft.proteinPer100) ?? 0;
  const fat = parseDraftNumber(draft.fatPer100) ?? 0;
  const carbs = parseDraftNumber(draft.carbsPer100) ?? 0;
  return roundKcal(protein * 4 + fat * 9 + carbs * 4);
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
  const protein = parseDraftNumber(draft.proteinPer100);
  const fat = parseDraftNumber(draft.fatPer100);
  const carbs = parseDraftNumber(draft.carbsPer100);
  const kcal = draft.kcalPer100.trim() ? parseDraftNumber(draft.kcalPer100) : getAutoKcalFromDraft(draft);
  const gramsPerUnit = draft.gramsPerUnit.trim() ? parseDraftNumber(draft.gramsPerUnit) : null;

  if (!draft.name.trim()) {
    return { valid: false, message: "Введите название продукта." };
  }

  if (protein === null || protein < 0 || fat === null || fat < 0 || carbs === null || carbs < 0) {
    return { valid: false, message: "Проверьте БЖУ на 100 г." };
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
