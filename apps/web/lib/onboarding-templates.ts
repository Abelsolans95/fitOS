// Default onboarding section templates for trainers
// Each call returns fresh IDs so templates are unique per use

import type { FormField } from "@/components/onboarding/FormFieldEditor";

function genId() {
  return Math.random().toString(36).substring(2, 15);
}

export interface SectionTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
}

/** Metadata for the 5 default sections (used for toggle UI) */
export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: "sec_medical",
    label: "Historial Medico",
    description: "Salud, patologias, medicacion y antecedentes",
    icon: "🏥",
  },
  {
    id: "sec_sports",
    label: "Historial Deportivo",
    description: "Deportes practicados, anos de experiencia",
    icon: "⚽",
  },
  {
    id: "sec_experience",
    label: "Experiencia en Entrenamiento",
    description: "Nivel, conocimiento de ejercicios, experiencia previa",
    icon: "🏋",
  },
  {
    id: "sec_current",
    label: "Estado Actual",
    description: "Actividad diaria, sueno, estres, estilo de vida",
    icon: "📊",
  },
  {
    id: "sec_goals",
    label: "Objetivos",
    description: "Metas principales, plazos y compromiso",
    icon: "🎯",
  },
];

/**
 * Generates a complete onboarding form template with 5 sections
 * and suggested questions in each. All IDs are unique per call.
 */
export function getOnboardingSectionsTemplate(): FormField[] {
  return [
    // ── Historial Medico ──
    {
      id: genId(),
      type: "section",
      label: "Historial Medico",
      description: "Informacion sobre tu salud y antecedentes medicos",
      required: false,
      enabled: true,
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Padeces alguna enfermedad o patologia diagnosticada?",
      required: false,
      placeholder: "Ej: diabetes, hipertension, asma...",
    },
    {
      id: genId(),
      type: "boolean",
      label: "¿Tomas alguna medicacion actualmente?",
      required: false,
    },
    {
      id: genId(),
      type: "textarea",
      label: "Si tomas medicacion, ¿cual y con que frecuencia?",
      required: false,
      placeholder: "Nombre del medicamento y dosis...",
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Has tenido alguna cirugia o intervencion quirurgica?",
      required: false,
      placeholder: "Describe cuales y cuando...",
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Tienes alguna lesion actual o cronica?",
      required: false,
      placeholder: "Ej: dolor lumbar, tendinitis, hernia discal...",
    },

    // ── Historial Deportivo ──
    {
      id: genId(),
      type: "section",
      label: "Historial Deportivo",
      description: "Tu experiencia con el deporte y la actividad fisica",
      required: false,
      enabled: true,
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Que deportes has practicado a lo largo de tu vida?",
      required: false,
      placeholder: "Deporte, anos y nivel alcanzado...",
    },
    {
      id: genId(),
      type: "select",
      label: "¿Cuantos anos llevas entrenando en gimnasio?",
      required: false,
      options: [
        "Nunca he entrenado en gimnasio",
        "Menos de 1 ano",
        "1-3 anos",
        "3-5 anos",
        "Mas de 5 anos",
      ],
    },
    {
      id: genId(),
      type: "select",
      label: "¿Con que frecuencia haces ejercicio actualmente?",
      required: false,
      options: [
        "No hago ejercicio",
        "1-2 veces por semana",
        "3-4 veces por semana",
        "5-6 veces por semana",
        "Todos los dias",
      ],
    },

    // ── Experiencia en Entrenamiento ──
    {
      id: genId(),
      type: "section",
      label: "Experiencia en Entrenamiento",
      description: "Tu nivel de conocimiento y experiencias previas con entrenamiento",
      required: false,
      enabled: true,
    },
    {
      id: genId(),
      type: "select",
      label: "¿Has trabajado antes con un entrenador personal?",
      required: false,
      options: [
        "Nunca",
        "Si, menos de 6 meses",
        "Si, entre 6 meses y 2 anos",
        "Si, mas de 2 anos",
      ],
    },
    {
      id: genId(),
      type: "multiselect",
      label: "¿Que tipo de entrenamiento conoces o has realizado?",
      required: false,
      options: [
        "Fuerza / Powerlifting",
        "Hipertrofia / Bodybuilding",
        "HIIT",
        "CrossFit",
        "Yoga / Pilates",
        "Cardio",
        "Calistenia",
        "Artes marciales",
        "Otro",
      ],
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Hay algun ejercicio o movimiento que te resulte dificil o incomodo?",
      required: false,
      placeholder: "Ej: sentadilla profunda, press militar, peso muerto...",
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Que es lo que mas te ha gustado de tus experiencias de entrenamiento anteriores?",
      required: false,
    },

    // ── Estado Actual ──
    {
      id: genId(),
      type: "section",
      label: "Estado Actual",
      description: "Tu situacion fisica y estilo de vida actual",
      required: false,
      enabled: true,
    },
    {
      id: genId(),
      type: "select",
      label: "¿Como describirias tu nivel de actividad diaria (fuera del gimnasio)?",
      required: false,
      options: [
        "Sedentario (trabajo de oficina, poco movimiento)",
        "Ligeramente activo (camino algo, alguna actividad ligera)",
        "Moderadamente activo (trabajo fisico o actividad regular)",
        "Muy activo (trabajo fisico intenso o mucho movimiento diario)",
      ],
    },
    {
      id: genId(),
      type: "select",
      label: "¿Cuantas horas duermes normalmente?",
      required: false,
      options: ["Menos de 5h", "5-6h", "6-7h", "7-8h", "Mas de 8h"],
    },
    {
      id: genId(),
      type: "scale",
      label: "¿Como valorarias tu calidad de sueno? (1 = muy mala, 10 = excelente)",
      required: false,
    },
    {
      id: genId(),
      type: "scale",
      label: "¿Como valorarias tu nivel de estres actual? (1 = bajo, 10 = muy alto)",
      required: false,
    },
    {
      id: genId(),
      type: "select",
      label: "¿Cuantos litros de agua bebes al dia aproximadamente?",
      required: false,
      options: [
        "Menos de 1 litro",
        "1-1.5 litros",
        "1.5-2 litros",
        "2-3 litros",
        "Mas de 3 litros",
      ],
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Tienes algun habito o rutina diaria que consideres relevante?",
      required: false,
      placeholder: "Ej: trabajo nocturno, viajo mucho, como fuera frecuentemente...",
    },

    // ── Objetivos ──
    {
      id: genId(),
      type: "section",
      label: "Objetivos",
      description: "Tus metas y expectativas con el entrenamiento",
      required: false,
      enabled: true,
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Cual es tu objetivo principal con el entrenamiento?",
      required: true,
      placeholder: "Describe tu meta de forma especifica...",
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Hay alguna meta secundaria que te gustaria lograr?",
      required: false,
      placeholder: "Ej: mejorar postura, dormir mejor, mas energia...",
    },
    {
      id: genId(),
      type: "select",
      label: "¿En cuanto tiempo esperas ver resultados?",
      required: false,
      options: ["1-3 meses", "3-6 meses", "6-12 meses", "Mas de 1 ano", "No tengo prisa"],
    },
    {
      id: genId(),
      type: "select",
      label: "¿Cuantos dias por semana puedes comprometerte a entrenar?",
      required: false,
      options: ["1-2 dias", "3 dias", "4 dias", "5 dias", "6+ dias"],
    },
    {
      id: genId(),
      type: "textarea",
      label: "¿Hay algo mas que quieras que tu entrenador sepa?",
      required: false,
      placeholder: "Cualquier detalle adicional...",
    },
  ];
}
