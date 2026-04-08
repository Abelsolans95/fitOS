"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { type MarketplaceProduct } from "./components/types";
import { ProductCard } from "./components/ProductCard";
import { CatalogFilters } from "./components/CatalogFilters";

const FETCH_LIMIT = 50;

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", String(FETCH_LIMIT));

      const res = await fetch(`/api/marketplace?${params.toString()}`);
      if (!res.ok) {
        setError("No se pudieron cargar los productos.");
        return;
      }
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timeout = setTimeout(loadProducts, 300);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  const filteredProducts = useMemo(() => products, [products]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-white">
            Fit<span className="text-[#00E5FF]">OS</span>
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm font-semibold text-[#00E5FF]">Marketplace</span>
            <Link
              href="/login"
              className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10]"
            >
              Iniciar sesion
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Marketplace de <span className="text-[#00E5FF]">Rutinas</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#8B8BA3]">
            Descubre rutinas creadas por entrenadores profesionales. Descarga el plan
            completo en formato PDF o .kuvox e importalo directamente en la app.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <CatalogFilters
            search={search}
            category={category}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={loadProducts}
              className="mt-4 rounded-xl bg-[#00E5FF] px-4 py-2 text-sm font-semibold text-[#0A0A0F]"
            >
              Reintentar
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="mb-4 h-16 w-16 text-[#5A5A72]/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
            <p className="text-sm text-[#5A5A72]">
              No se encontraron rutinas{search ? ` para "${search}"` : ""}.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 text-center text-xs text-[#5A5A72]">
        <p>Kuvox Marketplace &mdash; Rutinas de entrenadores profesionales</p>
      </footer>
    </div>
  );
}
