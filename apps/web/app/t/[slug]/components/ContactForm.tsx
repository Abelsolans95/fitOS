"use client";

import { useState } from "react";

interface ContactFormProps {
  trainerId: string;
  trainerName: string;
  accentColor: string;
}

export function ContactForm({ trainerId, trainerName, accentColor }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainer_id: trainerId,
          name: name.trim(),
          email: email.trim(),
          goal: goal.trim() || null,
          source: "landing",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al enviar. Intentalo de nuevo.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Error de conexion. Intentalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-8 text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <svg className="h-8 w-8" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Mensaje enviado</h3>
        <p className="mt-2 text-sm text-[#8B8BA3]">
          {trainerName} recibira tu mensaje y se pondra en contacto contigo pronto.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#12121A] p-6 sm:p-8">
      <h2 className="mb-6 text-xl font-bold text-white">
        Empieza a entrenar con {trainerName}
      </h2>

      {error && (
        <div className="mb-4 rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-3">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="lead-name" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Nombre *
          </label>
          <input
            id="lead-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            required
            className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-white/20"
          />
        </div>

        <div>
          <label htmlFor="lead-email" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Email *
          </label>
          <input
            id="lead-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-white/20"
          />
        </div>

        <div>
          <label htmlFor="lead-goal" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Objetivo (opcional)
          </label>
          <textarea
            id="lead-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Que quieres conseguir? (ej: perder peso, ganar musculo...)"
            rows={3}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-white/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !name.trim() || !email.trim()}
        className="mt-6 w-full rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: accentColor,
          color: "#0A0A0F",
        }}
      >
        {submitting ? "Enviando..." : "Quiero empezar"}
      </button>
    </form>
  );
}
