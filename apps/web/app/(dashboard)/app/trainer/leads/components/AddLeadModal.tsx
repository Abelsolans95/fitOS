"use client";

import { useState } from "react";
import type { LeadSource } from "./types";
import { SOURCE_LABELS } from "./types";

interface AddLeadModalProps {
  onClose: () => void;
  onAdd: (data: { name: string; email: string; phone: string; goal: string; source: LeadSource }) => void;
  adding: boolean;
}

const SOURCES = Object.entries(SOURCE_LABELS) as [LeadSource, string][];

export function AddLeadModal({ onClose, onAdd, adding }: AddLeadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [source, setSource] = useState<LeadSource>("manual");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim(), goal: goal.trim(), source });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#12121A] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Anadir lead</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B8BA3] hover:bg-white/[0.06] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-white/20"
              placeholder="Nombre del lead"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-white/20"
              placeholder="email@ejemplo.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
              Telefono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-white/20"
              placeholder="+34 600 000 000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
              Objetivo
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-white/20"
              placeholder="Perder peso, ganar musculo..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
              Origen
            </label>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSource(val)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    source === val
                      ? "bg-[#00E5FF]/15 text-[#00E5FF]"
                      : "bg-white/[0.04] text-[#8B8BA3] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={adding || !name.trim() || !email.trim()}
            className="w-full rounded-xl bg-[#00E5FF] py-2.5 text-sm font-bold text-[#0A0A0F] transition-all hover:bg-[#2BEEFF] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {adding ? "Anadiendo..." : "Anadir lead"}
          </button>
        </form>
      </div>
    </div>
  );
}
