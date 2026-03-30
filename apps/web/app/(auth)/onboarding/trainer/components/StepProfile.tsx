"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DarkSelect } from "@/components/ui/DarkSelect";

const SPECIALTIES = [
  "Fitness general",
  "Hipertrofia",
  "Fuerza",
  "CrossFit",
  "Yoga/Pilates",
  "Nutricion deportiva",
  "Rehabilitacion",
  "Otro",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

const SPECIALTY_OPTIONS = SPECIALTIES.map((s) => ({ value: s, label: s }));

interface StepProfileProps {
  businessName: string;
  setBusinessName: (v: string) => void;
  specialty: Specialty | "";
  setSpecialty: (v: Specialty) => void;
  bio: string;
  setBio: (v: string) => void;
}

export function StepProfile({
  businessName,
  setBusinessName,
  specialty,
  setSpecialty,
  bio,
  setBio,
}: StepProfileProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Perfil de negocio
        </h2>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Cuentanos sobre ti y tu negocio de entrenamiento.
        </p>
      </div>

      {/* Business name */}
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-[#8B8BA3]">
          Nombre del negocio <span className="text-[#FF1744]">*</span>
        </Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Ej: FitPro Studio, Carlos Training..."
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
        />
      </div>

      {/* Specialty */}
      <div className="space-y-2">
        <Label htmlFor="specialty" className="text-[#8B8BA3]">
          Especialidad <span className="text-[#FF1744]">*</span>
        </Label>
        <DarkSelect
          value={specialty}
          onChange={(v) => setSpecialty(v as Specialty)}
          options={SPECIALTY_OPTIONS}
          placeholder="Selecciona tu especialidad"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-[#8B8BA3]">
          Bio / Descripcion{" "}
          <span className="text-[#8B8BA3]/50">(opcional)</span>
        </Label>
        <textarea
          id="bio"
          rows={4}
          placeholder="Describe tu experiencia, tu enfoque y que te diferencia de otros entrenadores..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2.5 text-sm text-white placeholder:text-[#8B8BA3]/50 transition-colors outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 resize-none"
        />
        <p className="text-xs text-[#8B8BA3]/50">
          {bio.length}/500 caracteres
        </p>
      </div>
    </div>
  );
}
