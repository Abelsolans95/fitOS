"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { DarkSelect } from "@/components/ui/DarkSelect";
import { toast } from "sonner";
import type { Lead, LeadStatus, LeadSource } from "./components/types";
import { COLUMNS, SOURCE_LABELS } from "./components/types";
import { KanbanColumn } from "./components/KanbanColumn";
import { LeadDetailPanel } from "./components/LeadDetailPanel";
import { AddLeadModal } from "./components/AddLeadModal";

const SOURCE_OPTIONS = [
  { value: "all", label: "Todos los origenes" },
  ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
];

function LeadsPageInner() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const supabaseRef = useRef(createClient());
  const userIdRef = useRef<string | null>(null);

  // ── Load leads ──
  useEffect(() => {
    const load = async () => {
      const supabase = supabaseRef.current;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      userIdRef.current = user.id;

      const { data, error } = await supabase
        .from("leads")
        .select("id, trainer_id, name, email, phone, goal, source, status, notes, created_at, updated_at")
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        toast.error("Error al cargar los leads");
        console.error("[Leads] load:", error);
      }

      setLeads((data as Lead[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Drag & drop: move lead to new status ──
  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null);
    }

    const supabase = supabaseRef.current;
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast.error("Error al actualizar el estado");
      console.error("[Leads] updateStatus:", error);
      // Revert optimistic
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l)));
    }
  }, [leads, selectedLead]);

  // ── Update notes (debounced via onBlur or direct) ──
  const handleUpdateNotes = useCallback(async (notes: string) => {
    if (!selectedLead) return;
    setSelectedLead((prev) => prev ? { ...prev, notes } : null);
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes } : l)));
  }, [selectedLead]);

  // ── Persist notes on close ──
  const handleCloseDetail = useCallback(async () => {
    if (selectedLead) {
      const supabase = supabaseRef.current;
      const { error } = await supabase
        .from("leads")
        .update({ notes: selectedLead.notes ?? null })
        .eq("id", selectedLead.id);

      if (error) {
        toast.error("Error al guardar las notas");
        console.error("[Leads] saveNotes:", error);
      }
    }
    setSelectedLead(null);
  }, [selectedLead]);

  // ── Update status from detail panel ──
  const handleUpdateStatus = useCallback(async (newStatus: LeadStatus) => {
    if (!selectedLead || selectedLead.status === newStatus) return;
    setSaving(true);

    const oldStatus = selectedLead.status;
    setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null);
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus } : l)));

    const supabase = supabaseRef.current;
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", selectedLead.id);

    if (error) {
      toast.error("Error al actualizar el estado");
      console.error("[Leads] updateStatus:", error);
      setSelectedLead((prev) => prev ? { ...prev, status: oldStatus } : null);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, status: oldStatus } : l)));
    }

    setSaving(false);
  }, [selectedLead]);

  // ── Delete lead ──
  const handleDelete = useCallback(async () => {
    if (!selectedLead) return;
    setSaving(true);

    const supabase = supabaseRef.current;
    const { error } = await supabase.from("leads").delete().eq("id", selectedLead.id);

    if (error) {
      toast.error("Error al eliminar el lead");
      console.error("[Leads] delete:", error);
      setSaving(false);
      return;
    }

    setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id));
    setSelectedLead(null);
    setSaving(false);
    toast.success("Lead eliminado");
  }, [selectedLead]);

  // ── Add lead manually ──
  const handleAddLead = useCallback(async (data: { name: string; email: string; phone: string; goal: string; source: LeadSource }) => {
    if (!userIdRef.current) return;
    setAdding(true);

    const supabase = supabaseRef.current;
    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        trainer_id: userIdRef.current,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        goal: data.goal || null,
        source: data.source,
        status: "nuevo" as const,
      })
      .select("id, trainer_id, name, email, phone, goal, source, status, notes, created_at, updated_at")
      .single();

    if (error) {
      toast.error("Error al anadir el lead");
      console.error("[Leads] add:", error);
      setAdding(false);
      return;
    }

    setLeads((prev) => [newLead as Lead, ...prev]);
    setShowAddModal(false);
    setAdding(false);
    toast.success("Lead anadido");
  }, []);

  // ── Filtered leads ──
  const filteredLeads = sourceFilter === "all"
    ? leads
    : leads.filter((l) => l.source === sourceFilter);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Leads</h1>
          <p className="mt-1 text-sm text-[#5A5A72]">
            Pipeline de captacion — {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DarkSelect
            value={sourceFilter}
            onChange={setSourceFilter}
            options={SOURCE_OPTIONS}
            placeholder="Filtrar por origen"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-bold text-[#0A0A0F] transition-all hover:bg-[#2BEEFF]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Anadir lead
          </button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 220px)" }}>
        {COLUMNS.map((column) => {
          const columnLeads = filteredLeads.filter((l) => l.status === column.status);
          return (
            <KanbanColumn
              key={column.status}
              column={column}
              leads={columnLeads}
              onSelect={setSelectedLead}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          );
        })}
      </div>

      {/* ── Detail panel ── */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          saving={saving}
          onClose={handleCloseDetail}
          onUpdateStatus={handleUpdateStatus}
          onUpdateNotes={handleUpdateNotes}
          onDelete={handleDelete}
        />
      )}

      {/* ── Add modal ── */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddLead}
          adding={adding}
        />
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    }>
      <LeadsPageInner />
    </Suspense>
  );
}
