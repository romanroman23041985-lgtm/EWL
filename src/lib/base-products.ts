import { spreadsheetProducts } from "@/lib/spreadsheet-products";
import type { Product } from "@/lib/types";

const curatedProducts: Product[] = [
  { id: "oatmeal", name: "Овсянка", icon: "🥣", proteinPer100: 12.3, fatPer100: 6.1, carbsPer100: 59.5, kcalPer100: 342, searchTerms: ["Крупы: Овсянка"] },
  { id: "egg", name: "Яйцо", icon: "🥚", proteinPer100: 12.7, fatPer100: 10.9, carbsPer100: 0.7, kcalPer100: 157, searchTerms: ["Яйца: Яйцо куриное"] },
  { id: "cottage-cheese", name: "Творог 5%", icon: "🧀", proteinPer100: 17, fatPer100: 5, carbsPer100: 3, kcalPer100: 121 },
  { id: "greek-yogurt", name: "Греческий йогурт", icon: "🥛", proteinPer100: 8.5, fatPer100: 2.8, carbsPer100: 4.2, kcalPer100: 78 },
  { id: "banana", name: "Банан", icon: "🍌", proteinPer100: 1.5, fatPer100: 0.2, carbsPer100: 21.8, kcalPer100: 95 },
  { id: "apple", name: "Яблоко", icon: "🍎", proteinPer100: 0.4, fatPer100: 0.4, carbsPer100: 11.3, kcalPer100: 52 },
  { id: "berries", name: "Ягоды", icon: "🫐", proteinPer100: 1, fatPer100: 0.5, carbsPer100: 8.7, kcalPer100: 47 },
  { id: "almonds", name: "Миндаль", icon: "🌰", proteinPer100: 21.2, fatPer100: 49.9, carbsPer100: 9.1, kcalPer100: 579 },
  { id: "chicken", name: "Куриная грудка", icon: "🍗", proteinPer100: 23.6, fatPer100: 1.9, carbsPer100: 0, kcalPer100: 113, searchTerms: ["Мясо: Куриная грудка"] },
  { id: "turkey", name: "Индейка", icon: "🍗", proteinPer100: 21.6, fatPer100: 4.1, carbsPer100: 0, kcalPer100: 132 },
  { id: "salmon", name: "Лосось", icon: "🐟", proteinPer100: 20, fatPer100: 13, carbsPer100: 0, kcalPer100: 208 },
  { id: "tuna", name: "Тунец", icon: "🐟", proteinPer100: 24, fatPer100: 1, carbsPer100: 0, kcalPer100: 109 },
  { id: "rice", name: "Рис", icon: "🍚", proteinPer100: 7, fatPer100: 0.6, carbsPer100: 74, kcalPer100: 333 },
  { id: "buckwheat", name: "Гречка", icon: "🌾", proteinPer100: 12.6, fatPer100: 3.3, carbsPer100: 62.1, kcalPer100: 313 },
  { id: "pasta", name: "Паста", icon: "🍝", proteinPer100: 11, fatPer100: 1.3, carbsPer100: 71.5, kcalPer100: 344 },
  { id: "potato", name: "Картофель", icon: "🥔", proteinPer100: 2, fatPer100: 0.4, carbsPer100: 16.3, kcalPer100: 77 },
  { id: "avocado", name: "Авокадо", icon: "🥑", proteinPer100: 2, fatPer100: 14.7, carbsPer100: 8.5, kcalPer100: 160 },
  { id: "olive-oil", name: "Оливковое масло", icon: "🫒", proteinPer100: 0, fatPer100: 100, carbsPer100: 0, kcalPer100: 884 },
  { id: "bread", name: "Хлеб цельнозерновой", icon: "🍞", proteinPer100: 12, fatPer100: 3.5, carbsPer100: 41, kcalPer100: 247 },
  { id: "kefir", name: "Кефир", icon: "🥛", proteinPer100: 3.2, fatPer100: 2.5, carbsPer100: 4, kcalPer100: 51 },
  { id: "cucumber", name: "Огурец", icon: "🥒", proteinPer100: 0.8, fatPer100: 0.1, carbsPer100: 2.8, kcalPer100: 15 },
  { id: "tomato", name: "Помидор", icon: "🍅", proteinPer100: 1.1, fatPer100: 0.2, carbsPer100: 3.8, kcalPer100: 20 },
  {
    id: "pizza",
    name: "Пицца",
    icon: "🍕",
    proteinPer100: 11,
    fatPer100: 11.5,
    carbsPer100: 28,
    kcalPer100: 260,
    unitMode: "piece",
    unitLabel: "кусок",
    gramsPerUnit: 140,
    searchTerms: ["Додо Пицца Чиризо"],
  },
  {
    id: "choco-pie",
    name: "Чоко Пай",
    icon: "🍫",
    proteinPer100: 3.6,
    fatPer100: 17.5,
    carbsPer100: 70,
    kcalPer100: 456,
    unitMode: "piece",
    unitLabel: "шт.",
    gramsPerUnit: 30,
    searchTerms: ["ЧОКО ПАЙ", "Сладости: Чоко Пай", "чокопай"],
  },
];

function normalizeName(name: string) {
  return name.trim().toLowerCase().replaceAll("ё", "е");
}

function getIconByProduct(product: Product) {
  if (product.icon?.trim()) {
    return product.icon;
  }

  const scope = `${product.name} ${product.notes ?? ""}`.toLowerCase();

  if (scope.includes("пиц")) return "🍕";
  if (scope.includes("шокол") || scope.includes("конф") || scope.includes("слад") || scope.includes("чоко")) return "🍫";
  if (scope.includes("масло")) return "🫒";
  if (scope.includes("рыб") || scope.includes("лосос") || scope.includes("тунец") || scope.includes("сельд")) return "🐟";
  if (scope.includes("мяс") || scope.includes("кур") || scope.includes("индей") || scope.includes("говя") || scope.includes("свин")) return "🍗";
  if (scope.includes("яйц")) return "🥚";
  if (scope.includes("мол") || scope.includes("сыр") || scope.includes("твор") || scope.includes("кеф") || scope.includes("йогур")) return "🥛";
  if (scope.includes("круп") || scope.includes("греч") || scope.includes("рис") || scope.includes("каш")) return "🍚";
  if (scope.includes("макарон") || scope.includes("паста")) return "🍝";
  if (scope.includes("овощ") || scope.includes("салат") || scope.includes("огур") || scope.includes("помид")) return "🥗";
  if (scope.includes("фрукт") || scope.includes("яблок") || scope.includes("банан")) return "🍎";
  if (scope.includes("ягод")) return "🫐";
  if (scope.includes("орех")) return "🥜";
  if (scope.includes("гриб")) return "🍄";
  if (scope.includes("хлеб")) return "🍞";
  if (scope.includes("напит") || scope.includes("кофе") || scope.includes("чай")) return "☕";
  if (scope.includes("боб")) return "🫘";
  if (scope.includes("колбас") || scope.includes("сосиск") || scope.includes("ветчин")) return "🥓";

  return undefined;
}

function withPresentation(product: Product): Product {
  return {
    ...product,
    icon: getIconByProduct(product),
  };
}

export function buildBaseProducts() {
  const existingNames = new Set(curatedProducts.map((product) => normalizeName(product.name)));

  return [
    ...curatedProducts.map(withPresentation),
    ...spreadsheetProducts
      .filter((product) => !existingNames.has(normalizeName(product.name)))
      .map(withPresentation),
  ];
}

export function mergeBuiltInProducts(products: Product[]) {
  const baseProducts = buildBaseProducts();
  const existingIds = new Set(products.map((product) => product.id));
  return [...products.map(withPresentation), ...baseProducts.filter((product) => !existingIds.has(product.id))];
}
