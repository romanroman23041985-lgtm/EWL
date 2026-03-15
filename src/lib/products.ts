import { roundKcal } from "@/lib/macros";
import type { Product, ProductDraft } from "@/lib/types";

export function getProductInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function getVisibleProducts(products: Product[]) {
  return products.filter((product) => !product.archivedAt);
}

export function rankProducts(products: Product[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return getVisibleProducts(products).sort((left, right) => left.name.localeCompare(right.name, "ru"));
  }

  return getVisibleProducts(products)
    .filter((product) => product.name.toLowerCase().includes(normalized))
    .sort((left, right) => {
      const leftName = left.name.toLowerCase();
      const rightName = right.name.toLowerCase();
      const leftScore = getSearchScore(leftName, normalized);
      const rightScore = getSearchScore(rightName, normalized);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return left.name.localeCompare(right.name, "ru");
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

export function validateProductDraft(draft: ProductDraft) {
  const protein = parseDraftNumber(draft.proteinPer100);
  const fat = parseDraftNumber(draft.fatPer100);
  const carbs = parseDraftNumber(draft.carbsPer100);
  const kcal = draft.kcalPer100.trim() ? parseDraftNumber(draft.kcalPer100) : getAutoKcalFromDraft(draft);

  if (!draft.name.trim()) {
    return { valid: false, message: "Введите название продукта." };
  }

  if (protein === null || protein < 0 || fat === null || fat < 0 || carbs === null || carbs < 0) {
    return { valid: false, message: "Проверьте БЖУ на 100 г." };
  }

  if (kcal === null || kcal < 0) {
    return { valid: false, message: "Проверьте калории." };
  }

  return { valid: true, message: "" };
}
