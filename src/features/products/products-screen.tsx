"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ProductAvatar } from "@/components/product-avatar";
import { ProductFormSheet } from "@/components/product-form-sheet";
import { getProductQuantityMode, getProductUnitLabel, rankProducts } from "@/lib/products";
import { getActiveProducts, getProductUsageCount } from "@/lib/selectors";
import type { Product } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

export function ProductsScreen() {
  const { state, createProduct, updateProduct, deleteProduct } = useAppStore();
  const [query, setQuery] = useState("");
  const [editorState, setEditorState] = useState<{ mode: "create" } | { mode: "edit"; product: Product } | null>(
    null,
  );
  const products = getActiveProducts(state);
  const filteredProducts = useMemo(() => rankProducts(products, query), [products, query]);

  if (!state.hydrated) {
    return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Открываю продукты...</div>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-[linear-gradient(150deg,#fff9f5_0%,#edf9ff_50%,#ffe9f1_100%)] px-5 py-5 shadow-[0_18px_50px_rgba(123,139,146,0.16)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Products</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">База продуктов</h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Здесь лежит весь каталог из таблицы и ваши локальные продукты. Можно редактировать, добавлять и убирать лишнее.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditorState({ mode: "create" })}
            className="rounded-[1rem] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            + Добавить
          </button>
        </div>

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

      <section className="app-card rounded-[2rem] p-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти курочку, пиццу, рис, чокопай..."
          className="h-12 w-full rounded-[1rem] border border-[var(--color-outline)] bg-white px-4 outline-none"
        />
      </section>

      {filteredProducts.length ? (
        <section className="space-y-3">
          {filteredProducts.map((product) => {
            const quantityMode = getProductQuantityMode(product);
            const usageCount = getProductUsageCount(state, product.id);

            return (
              <article key={product.id} className="app-card rounded-[1.75rem] p-4">
                <div className="flex items-start gap-3">
                  <ProductAvatar icon={product.icon} name={product.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-900">{product.name}</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Б {product.proteinPer100} • Ж {product.fatPer100} • У {product.carbsPer100} •{" "}
                          {product.kcalPer100 ?? "auto"} ккал
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditorState({ mode: "edit", product })}
                          className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          Править
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          className="rounded-full bg-[var(--color-danger-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-danger)]"
                        >
                          Убрать
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-[var(--color-mint-soft)] px-3 py-1.5 font-semibold text-[var(--color-mint)]">
                        {quantityMode === "piece"
                          ? `По штукам • 1 ${getProductUnitLabel(product)} = ${product.gramsPerUnit ?? 0} г`
                          : "По граммам"}
                      </span>
                      {product.notes ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{product.notes}</span>
                      ) : null}
                      {usageCount ? (
                        <span className="rounded-full bg-white px-3 py-1.5 text-slate-500">Использован {usageCount} раз</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте другое название или добавьте новый продукт вручную."
          action={
            <button
              type="button"
              onClick={() => setEditorState({ mode: "create" })}
              className="rounded-[1rem] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Добавить продукт
            </button>
          }
        />
      )}

      {editorState ? (
        <ProductFormSheet
          key={editorState.mode === "edit" ? editorState.product.id : "create"}
          mode={editorState.mode}
          product={editorState.mode === "edit" ? editorState.product : undefined}
          usageCount={editorState.mode === "edit" ? getProductUsageCount(state, editorState.product.id) : 0}
          onClose={() => setEditorState(null)}
          onSave={(draft) => {
            if (editorState.mode === "create") {
              createProduct(draft);
            } else {
              updateProduct(editorState.product.id, draft);
            }
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
