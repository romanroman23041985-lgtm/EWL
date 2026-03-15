"use client";

import { useMemo, useState } from "react";
import { ProductAvatar } from "@/components/product-avatar";
import { ProductFormSheet } from "@/components/product-form-sheet";
import { mealLabels, mealOrder } from "@/lib/constants";
import {
  formatAmountValue,
  getDefaultProductAmount,
  getProductQuantityMode,
  getProductUnitLabel,
  rankProducts,
  toMealItemQuantity,
} from "@/lib/products";
import type { MealType, Product, ProductDraft } from "@/lib/types";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; product: Product }
  | null;

export function ProductSearchSheet({
  open,
  products,
  recentProducts,
  initialMealType,
  onClose,
  onSubmit,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  getProductUsageCount,
}: {
  open: boolean;
  products: Product[];
  recentProducts: Product[];
  initialMealType: MealType;
  onClose: () => void;
  onSubmit: (payload: {
    mealType: MealType;
    productId: string;
    grams: number;
    quantityMode?: "grams" | "piece";
    servings?: number | null;
  }) => void;
  onCreateProduct: (draft: ProductDraft) => void;
  onUpdateProduct: (productId: string, draft: ProductDraft) => void;
  onDeleteProduct: (productId: string) => void;
  getProductUsageCount: (productId: string) => number;
}) {
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [amount, setAmount] = useState("100");
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [editorState, setEditorState] = useState<EditorState>(null);

  const filteredProducts = useMemo(() => rankProducts(products, query), [products, query]);
  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ??
    recentProducts.find((product) => product.id === selectedProductId) ??
    products.find((product) => product.id === selectedProductId);
  const numericAmount = Number(amount.replace(",", "."));
  const selectedMode = getProductQuantityMode(selectedProduct);
  const unitLabel = getProductUnitLabel(selectedProduct);
  const canSubmit = Boolean(selectedProduct) && Number.isFinite(numericAmount) && numericAmount > 0;
  const quickAmounts = selectedMode === "piece" ? [1, 2, 3] : [100, 200, 300, 400];

  if (!open) {
    return null;
  }

  const selectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setAmount(getDefaultProductAmount(product));
  };

  const renderProductRow = (product: Product, compact = false) => {
    const active = selectedProductId === product.id;
    const isPieceProduct = getProductQuantityMode(product) === "piece";

    return (
      <div
        key={product.id}
        className={`w-full rounded-[1.35rem] border px-3 py-3 text-left transition ${
          active
            ? "border-transparent bg-[var(--color-mint-soft)] shadow-[0_10px_24px_rgba(82,199,186,0.18)]"
            : "border-[var(--color-outline)] bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => selectProduct(product)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <ProductAvatar icon={product.icon} name={product.name} size={compact ? "sm" : "md"} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Б {product.proteinPer100} • Ж {product.fatPer100} • У {product.carbsPer100} •{" "}
                    {product.kcalPer100 ?? "auto"} ккал
                  </p>
                </div>
                {product.isCustom ? (
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)]">
                    Свой
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {isPieceProduct ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    1 {getProductUnitLabel(product)} ≈ {formatAmountValue(product.gramsPerUnit ?? 0)} г
                  </span>
                ) : null}
                {active ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--color-mint)]">
                    Выбрано
                  </span>
                ) : null}
              </div>
            </div>
          </button>
          {product.isCustom ? (
            <button
              type="button"
              onClick={() => setEditorState({ mode: "edit", product })}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Править
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end bg-slate-900/30 p-3">
        <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-[#fffdfa] shadow-[0_20px_60px_rgba(35,43,53,0.2)]">
          <div className="px-4 pb-4 pt-4">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Добавить продукт</h3>
                <p className="mt-1 text-sm text-slate-500">Быстрый поиск, недавние и свои продукты в одном месте.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
              >
                Закрыть
              </button>
            </div>

            <input
              type="search"
              placeholder="Найти продукт"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-4 h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 outline-none"
            />

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {mealOrder.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setMealType(candidate)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    mealType === candidate ? "bg-[var(--color-accent)] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {mealLabels[candidate]}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {!query.trim() && recentProducts.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-900">Недавние</h4>
                  <span className="text-xs text-slate-400">Быстрый повтор</span>
                </div>
                <div className="space-y-2">
                  {recentProducts.map((product) => renderProductRow(product, true))}
                </div>
              </section>
            ) : null}

            <section className={recentProducts.length && !query.trim() ? "mt-5" : ""}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  {query.trim() ? "Результаты поиска" : "Все продукты"}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditorState({ mode: "create" })}
                  className="rounded-full bg-[var(--color-accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-accent)]"
                >
                  + Свой продукт
                </button>
              </div>

              {filteredProducts.length ? (
                <div className="space-y-2">
                  {filteredProducts.map((product) => renderProductRow(product))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[var(--color-outline)] bg-white/70 px-4 py-6 text-sm leading-6 text-slate-500">
                  Ничего не найдено. Можно добавить свой продукт и сразу использовать его в плане.
                </div>
              )}
            </section>
          </div>

          <div className="border-t border-[var(--color-outline)] bg-[#fffdfa] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <div className="rounded-[1.25rem] bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {selectedMode === "piece" ? "Количество" : "Граммовка"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedProduct
                      ? `Добавление в ${mealLabels[mealType].toLowerCase()}.`
                      : "Сначала выберите продукт."}
                  </p>
                </div>
                {selectedProduct ? (
                  <div className="rounded-full bg-[var(--color-mint-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-mint)]">
                    {selectedMode === "piece" ? unitLabel : "граммы"}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min="0.1"
                  step={selectedMode === "piece" ? "0.5" : "5"}
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-12 min-w-0 flex-1 rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedProduct || !canSubmit) {
                      return;
                    }

                    onSubmit({
                      mealType,
                      productId: selectedProduct.id,
                      ...toMealItemQuantity(selectedProduct, numericAmount),
                    });
                    onClose();
                  }}
                  disabled={!canSubmit}
                  className="min-w-[132px] rounded-[1rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(243,124,165,0.32)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Добавить
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(String(quickAmount))}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      Number(amount.replace(",", ".")) === quickAmount
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {quickAmount} {unitLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editorState ? (
        <ProductFormSheet
          key={editorState.mode === "edit" ? editorState.product.id : "create"}
          mode={editorState.mode}
          product={editorState.mode === "edit" ? editorState.product : undefined}
          usageCount={editorState.mode === "edit" ? getProductUsageCount(editorState.product.id) : 0}
          onClose={() => setEditorState(null)}
          onSave={(draft) => {
            if (editorState.mode === "create") {
              onCreateProduct(draft);
            } else {
              onUpdateProduct(editorState.product.id, draft);
            }
            setEditorState(null);
          }}
          onDelete={
            editorState.mode === "edit"
              ? () => {
                  onDeleteProduct(editorState.product.id);
                  if (selectedProductId === editorState.product.id) {
                    setSelectedProductId("");
                  }
                  setEditorState(null);
                }
              : undefined
          }
        />
      ) : null}
    </>
  );
}
