"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  type TrainerProduct,
  type RoutineOption,
  type PublishFormData,
} from "./components/types";
import { ProductList } from "./components/ProductList";
import { PublishForm } from "./components/PublishForm";

const INITIAL_FORM: PublishFormData = {
  routine_id: "",
  title: "",
  description: "",
  price_cents: 0,
  category: "",
  cover_image_url: "",
};

export default function TrainerMarketplacePage() {
  const [products, setProducts] = useState<TrainerProduct[]>([]);
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PublishFormData>(INITIAL_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (authError || !user) {
        toast.error("No se pudo obtener la sesion del usuario.");
        setLoading(false);
        return;
      }

      const [productsRes, routinesRes] = await Promise.all([
        supabase
          .from("marketplace_products")
          .select(
            "id, title, description, price_cents, currency, category, cover_image_url, status, downloads, created_at"
          )
          .eq("trainer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("user_routines")
          .select("id, title, goal, training_days, total_weeks")
          .eq("trainer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (productsRes.error) {
        console.error("[TrainerMarketplace] Error loading products");
      }
      if (routinesRes.error) {
        console.error("[TrainerMarketplace] Error loading routines");
      }

      setProducts(productsRes.data ?? []);
      setRoutines(routinesRes.data ?? []);
    } catch {
      toast.error("Error inesperado al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateField = useCallback((fields: Partial<PublishFormData>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.routine_id || !form.title.trim() || !form.description.trim() || !form.category) {
      toast.error("Completa todos los campos obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/marketplace/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routine_id: form.routine_id,
          title: form.title.trim(),
          description: form.description.trim(),
          price_cents: form.price_cents,
          category: form.category,
          cover_image_url: form.cover_image_url.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al publicar el producto.");
        return;
      }

      toast.success("Producto enviado a revision. Lo revisaremos pronto.");
      setShowForm(false);
      setForm(INITIAL_FORM);
      loadData();
    } catch {
      toast.error("Error de conexion. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }, [form, loadData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          <p className="mt-1 text-sm text-[#5A5A72]">
            Publica tus rutinas y genera ingresos pasivos. Comision Kuvox: 15-20% por venta.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Publicar rutina
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">
            Productos
          </p>
          <p className="mt-1 text-2xl font-black text-white">{products.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">
            Publicados
          </p>
          <p className="mt-1 text-2xl font-black text-green-400">
            {products.filter((p) => p.status === "published").length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">
            Descargas totales
          </p>
          <p className="mt-1 text-2xl font-black text-[#00E5FF]">
            {products.reduce((sum, p) => sum + p.downloads, 0)}
          </p>
        </div>
      </div>

      {/* Form or List */}
      {showForm ? (
        <PublishForm
          form={form}
          routines={routines}
          saving={saving}
          onUpdateField={handleUpdateField}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setForm(INITIAL_FORM);
          }}
        />
      ) : (
        <ProductList
          products={products}
          onNewProduct={() => setShowForm(true)}
        />
      )}
    </div>
  );
}
