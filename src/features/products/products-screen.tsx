"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ProductAiAssistantCard } from "@/components/product-ai-assistant-card";
import { ProductAvatar } from "@/components/product-avatar";
import { ProductFormSheet } from "@/components/product-form-sheet";
import { getProductQuantityMode, getProductUnitLabel, rankProducts } from "@/lib/products";
import { getActiveProducts, getProductTopNutrientHighlights, getProductUsageCount, getSelectedUser } from "@/lib/selectors";
import type { Product, ProductDraft } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const PAGE_SIZE = 20;

type EditorState =
  | { mode: "create"; draft?: ProductDraft; stamp: number }
  | { mode: "edit"; product: Product; stamp: number }
  | null;

export function ProductsScreen() {
  const { state, createProduct, updateProduct, deleteProduct } = useAppStore();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editorState, setEditorState] = useState<EditorState>(null);

  const user = getSelectedUser(state);
  const products = getActiveProducts(state);
  const filteredProducts = useMemo(() => rankProducts(products, query), [products, query]);
  const hasSearch = query.trim().length > 0;
  const visibleProducts = hasSearch ? filteredProducts : filteredProducts.slice(0, visibleCount);
  const canShowMore = !hasSearch && filteredProducts.length > visibleCount;

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Открываю продукты...</div>;
  }

  return (
    <div className="space-y-4">
      <section className="theme-important rounded-[2rem] p-4 shadow-[0_18px_40px_rgba(113,82,57,0.08)]">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Поиск по базе</div>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Найти курочку, пиццу, рис, чокопай..."
          className="theme-input h-12 w-full rounded-[1rem] border border-[rgba(137,104,80,0.26)] bg-white/95 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_20px_rgba(113,82,57,0.06)] outline-none"
        />
      </section>

      {hasSearch ? (
        <section className="space-y-3">
          {visibleProducts.map((product) => {
            const quantityMode = getProductQuantityMode(product);
            const usageCount = getProductUsageCount(state, product.id);
            const topHighlights = getProductTopNutrientHighlights(product, user);

            return (
              <article key={product.id} className="app-card rounded-[1.75rem] p-4">
                <div className="flex items-start gap-3">
                  <ProductAvatar
                    icon={product.icon}
                    name={product.name}
                    preferCustomIcon={Boolean(product.isCustom)}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-slate-900">{product.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Б {product.proteinPer100} • Ж {product.fatPer100} • У {product.carbsPer100} •{" "}
                      {product.kcalPer100 ?? "auto"} ккал
                    </p>
                    {topHighlights.length ? (
                      <p className="mt-2 text-xs font-medium text-slate-600">{topHighlights.map((item) => item.display).join(" • ")}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="theme-completed rounded-full px-3 py-1.5 font-semibold">
                        {quantityMode === "piece"
                          ? `По штукам • 1 ${getProductUnitLabel(product)} = ${product.gramsPerUnit ?? 0} г`
                          : "По граммам"}
                      </span>
                      {product.notes ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{product.notes}</span>
                      ) : null}
                      {usageCount ? (
                        <span className="theme-elevated rounded-full px-3 py-1.5 text-slate-500">
                          Использован {usageCount} раз
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setEditorState({ mode: "edit", product, stamp: Date.now() })}
                        className="theme-elevated min-h-11 w-full rounded-[1rem] px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        Править
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <>
          <ProductAiAssistantCard
            currentPath="/products"
            onUseDraft={(draft) => {
              setEditorState({ mode: "create", draft, stamp: Date.now() });
            }}
          />

          <section className="theme-catalog rounded-[2rem] px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Продукты</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">База продуктов</h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Здесь хранится весь каталог: база из таблицы и ваши собственные продукты.
            </p>

            <button
              type="button"
              onClick={() => setEditorState({ mode: "create", stamp: Date.now() })}
              className="theme-accent-button mt-4 flex min-h-12 w-full items-center justify-center rounded-[1.2rem] px-5 py-3 text-sm font-semibold"
            >
              Добавить
            </button>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[1.25rem] bg-white/90 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Всего продуктов</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{products.length}</div>
              </div>
              <div className="rounded-[1.25rem] bg-white/90 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Найдено сейчас</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{filteredProducts.length}</div>
              </div>
            </div>
          </section>

          {filteredProducts.length ? (
            <section className="space-y-3">
              {visibleProducts.map((product) => {
                const quantityMode = getProductQuantityMode(product);
                const usageCount = getProductUsageCount(state, product.id);
                const topHighlights = getProductTopNutrientHighlights(product, user);

                return (
                  <article key={product.id} className="app-card rounded-[1.75rem] p-4">
                    <div className="flex items-start gap-3">
                      <ProductAvatar
                        icon={product.icon}
                        name={product.name}
                        preferCustomIcon={Boolean(product.isCustom)}
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-slate-900">{product.name}</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Б {product.proteinPer100} • Ж {product.fatPer100} • У {product.carbsPer100} •{" "}
                          {product.kcalPer100 ?? "auto"} ккал
                        </p>
                        {topHighlights.length ? (
                          <p className="mt-2 text-xs font-medium text-slate-600">{topHighlights.map((item) => item.display).join(" • ")}</p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="theme-completed rounded-full px-3 py-1.5 font-semibold">
                            {quantityMode === "piece"
                              ? `По штукам • 1 ${getProductUnitLabel(product)} = ${product.gramsPerUnit ?? 0} г`
                              : "По граммам"}
                          </span>
                          {product.notes ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{product.notes}</span>
                          ) : null}
                          {usageCount ? (
                            <span className="theme-elevated rounded-full px-3 py-1.5 text-slate-500">
                              Использован {usageCount} раз
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setEditorState({ mode: "edit", product, stamp: Date.now() })}
                            className="theme-elevated min-h-11 w-full rounded-[1rem] px-4 py-3 text-sm font-semibold text-slate-700"
                          >
                            Править
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {canShowMore ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                  className="theme-elevated min-h-12 w-full rounded-[1.3rem] px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Еще {Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)}
                </button>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {!filteredProducts.length ? (
        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте другое название или добавьте новый продукт вручную."
          action={
            <button
              type="button"
              onClick={() => setEditorState({ mode: "create", stamp: Date.now() })}
              className="theme-accent-button rounded-[1rem] px-5 py-3 text-sm font-semibold"
            >
              Добавить продукт
            </button>
          }
        />
      ) : null}

      {editorState ? (
        <ProductFormSheet
          key={editorState.mode === "edit" ? `edit-${editorState.product.id}` : `create-${editorState.stamp}`}
          mode={editorState.mode}
          product={editorState.mode === "edit" ? editorState.product : undefined}
          initialDraft={editorState.mode === "create" ? editorState.draft : undefined}
          usageCount={editorState.mode === "edit" ? getProductUsageCount(state, editorState.product.id) : 0}
          onClose={() => setEditorState(null)}
          onSave={(draft) => {
            if (editorState.mode === "create") {
              const createdProduct = createProduct(draft);
              setQuery(createdProduct.name);
              setVisibleCount(PAGE_SIZE);
              setEditorState({ mode: "edit", product: createdProduct, stamp: Date.now() });
              return;
            }

            updateProduct(editorState.product.id, draft);
            setEditorState(null);
          }}
          onDelete={
            editorState.mode === "edit"
              ? () => {
                  deleteProduct(editorState.product.id);
                  setEditorState(null);
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
