"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  type MarketplaceProduct,
  formatPrice,
  categoryLabel,
} from "../components/types";
import { generateKuvoxFile } from "@/lib/kuvox-format";

interface ProductDetail extends MarketplaceProduct {
  routine_data: Record<string, unknown>;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/marketplace?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          if (!cancelled) setError("Producto no encontrado.");
          return;
        }
        const data = await res.json();
        if (!cancelled) setProduct(data.product ?? null);
        if (!data.product && !cancelled) setError("Producto no encontrado.");
      } catch {
        if (!cancelled) setError("Error al cargar el producto.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleBuy() {
    toast.info("Pagos disponibles proximamente. Estamos integrando Stripe.");
  }

  function handlePreviewKuvox() {
    if (!product) return;

    const routineData = product.routine_data as {
      exercises?: Record<string, unknown[]> | unknown[];
      training_days?: string[];
      total_weeks?: number;
      day_labels?: Record<string, string>;
    };

    const kuvox = generateKuvoxFile(
      product.title,
      routineData as Parameters<typeof generateKuvoxFile>[1],
      { full_name: product.trainer_name, trainer_id: product.trainer_id },
      product.category,
      (routineData.total_weeks as number) ?? 4,
      (routineData.training_days as string[]) ?? [],
      undefined,
      null
    );

    const blob = new Blob([JSON.stringify(kuvox, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${product.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.kuvox`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Archivo .kuvox descargado (preview sin licencia).");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error ?? !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0F] text-white">
        <p className="text-sm text-red-400">{error ?? "Producto no encontrado."}</p>
        <Link
          href="/marketplace"
          className="mt-4 rounded-xl bg-[#00E5FF] px-4 py-2 text-sm font-semibold text-[#0A0A0F]"
        >
          Volver al marketplace
        </Link>
      </div>
    );
  }

  const routineData = product.routine_data as {
    exercises?: Record<string, unknown[]> | unknown[];
    training_days?: string[];
    total_weeks?: number;
  };
  const totalWeeks = (routineData.total_weeks as number) ?? 4;
  const trainingDays = (routineData.training_days as string[]) ?? [];
  const exerciseCount = Array.isArray(routineData.exercises)
    ? routineData.exercises.length
    : typeof routineData.exercises === "object" && routineData.exercises !== null
      ? Object.values(routineData.exercises).reduce(
          (sum: number, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
          0
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-white">
            Fit<span className="text-[#00E5FF]">OS</span>
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center gap-1.5 text-sm text-[#8B8BA3] transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver al marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left: content */}
          <div className="space-y-6">
            {/* Cover */}
            {product.cover_image_url && (
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={product.cover_image_url}
                  alt={product.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            <div>
              <span className="inline-block rounded-lg bg-[#00E5FF]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
                {categoryLabel(product.category)}
              </span>
              <h1 className="mt-3 text-3xl font-black text-white">
                {product.title}
              </h1>
              <p className="mt-1 text-sm text-[#5A5A72]">
                por {product.trainer_name}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#5A5A72]">
                Descripcion
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#E8E8ED]">
                {product.description}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
                <p className="text-2xl font-black text-[#00E5FF]">{totalWeeks}</p>
                <p className="mt-1 text-xs text-[#5A5A72]">Semanas</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
                <p className="text-2xl font-black text-[#7C3AED]">{trainingDays.length}</p>
                <p className="mt-1 text-xs text-[#5A5A72]">Dias/semana</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
                <p className="text-2xl font-black text-[#FF9100]">{exerciseCount}</p>
                <p className="mt-1 text-xs text-[#5A5A72]">Ejercicios</p>
              </div>
            </div>
          </div>

          {/* Right: purchase sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
              <p className="text-3xl font-black text-[#00E5FF]">
                {formatPrice(product.price_cents, product.currency)}
              </p>
              <p className="mt-1 text-xs text-[#5A5A72]">
                Pago unico &mdash; Incluye PDF + archivo .kuvox
              </p>

              <button
                onClick={handleBuy}
                className="mt-6 w-full rounded-xl bg-[#00E5FF] py-3 text-sm font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90"
              >
                Comprar ahora
              </button>

              <button
                onClick={handlePreviewKuvox}
                className="mt-3 w-full rounded-xl border border-white/[0.08] py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.04]"
              >
                Descargar preview .kuvox
              </button>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">
                Incluye
              </h3>
              <ul className="space-y-2 text-sm text-[#E8E8ED]">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Rutina completa en PDF
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Archivo .kuvox importable
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Periodizacion semanal incluida
                </li>
              </ul>
            </div>

            {product.downloads > 0 && (
              <p className="text-center text-xs text-[#5A5A72]">
                {product.downloads} {product.downloads === 1 ? "descarga" : "descargas"}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
