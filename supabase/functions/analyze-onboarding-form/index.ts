// Edge Function: analyze-onboarding-form
// Analiza las respuestas del formulario de onboarding de un cliente con IA
// POST /functions/v1/analyze-onboarding-form
// Body: { client_id, response_id }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, validateBodySize, sanitizeForPrompt, getCorsHeaders, corsHeaders } from "../_shared/auth.ts";

/** Groups flat fields by section for structured prompt */
function groupFieldsBySection(
  fields: Array<{ id: string; type: string; label: string; description?: string; enabled?: boolean }>
): Array<{
  sectionLabel: string | null;
  sectionDescription: string | null;
  fields: Array<{ id: string; label: string }>;
}> {
  const groups: Array<{
    sectionLabel: string | null;
    sectionDescription: string | null;
    fields: Array<{ id: string; label: string }>;
  }> = [];
  let current: (typeof groups)[number] | null = null;

  for (const field of fields) {
    if (field.type === "section") {
      if (field.enabled === false) {
        // Skip disabled sections — advance until next section
        current = null;
        continue;
      }
      current = {
        sectionLabel: field.label,
        sectionDescription: field.description || null,
        fields: [],
      };
      groups.push(current);
    } else {
      if (!current) {
        current = { sectionLabel: null, sectionDescription: null, fields: [] };
        groups.push(current);
      }
      current.fields.push({ id: field.id, label: field.label });
    }
  }

  return groups;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = getCorsHeaders(req);

  try {
    // SECURITY: Verify JWT and get authenticated user
    const { user, supabase } = await authenticateRequest(req);

    // SECURITY: Only trainers can analyze onboarding forms
    if (user.role !== "trainer") {
      return new Response(
        JSON.stringify({ error: "Solo entrenadores" }),
        { status: 403, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Limit body size
    const bodyText = await validateBodySize(req);
    const { client_id, response_id } = JSON.parse(bodyText);

    if (!client_id || !response_id) {
      return new Response(
        JSON.stringify({ error: "client_id and response_id are required" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate types
    if (typeof client_id !== "string" || typeof response_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Parametros invalidos" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify IDOR — trainer must manage this client
    const { data: tcCheck } = await supabase
      .from("trainer_clients")
      .select("client_id")
      .eq("trainer_id", user.id)
      .eq("client_id", client_id)
      .maybeSingle();

    if (!tcCheck) {
      return new Response(
        JSON.stringify({ error: "Cliente no autorizado" }),
        { status: 403, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Obtener la respuesta del onboarding
    const { data: onboardingResponse, error: fetchError } = await supabase
      .from("onboarding_responses")
      .select("*, onboarding_forms(title, fields)")
      .eq("id", response_id)
      .single();

    if (fetchError || !onboardingResponse) {
      return new Response(
        JSON.stringify({ error: "Respuesta de onboarding no encontrada" }),
        { status: 404, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Obtener perfil del cliente (columnas reales: height, weight)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, goal, weight, height, food_preferences")
      .eq("user_id", client_id)
      .single();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY no configurada",
          message: "Configura la API key de Anthropic para analisis con IA.",
          mock: true,
        }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const formFields = onboardingResponse.onboarding_forms?.fields || [];
    const answers = onboardingResponse.responses || {};

    // Group fields by section for structured analysis
    const sectionGroups = groupFieldsBySection(formFields);

    // Build section-aware Q&A context
    let qaContext = "";
    for (const group of sectionGroups) {
      if (group.sectionLabel) {
        qaContext += `\n--- SECCION: ${group.sectionLabel} ---\n`;
        if (group.sectionDescription) {
          qaContext += `(${group.sectionDescription})\n`;
        }
      }
      for (const field of group.fields) {
        const answer = answers[field.id];
        const answerStr = Array.isArray(answer) ? answer.join(", ") : answer;
        qaContext += `P: ${field.label}\nR: ${answerStr ?? "(sin respuesta)"}\n\n`;
      }
    }

    // Format food preferences
    const foodPrefs = profile?.food_preferences;
    let foodPrefsStr = "No especificadas";
    if (foodPrefs && typeof foodPrefs === "object") {
      const parts: string[] = [];
      if (foodPrefs.dietary_restrictions?.length) {
        parts.push(`Restricciones: ${foodPrefs.dietary_restrictions.join(", ")}`);
      }
      if (foodPrefs.allergies) parts.push(`Alergias: ${foodPrefs.allergies}`);
      if (foodPrefs.disliked_foods) parts.push(`No le gusta: ${foodPrefs.disliked_foods}`);
      if (parts.length) foodPrefsStr = parts.join(". ");
    }

    // SECURITY: Sanitize all user-controlled inputs before prompt interpolation
    const safeName = sanitizeForPrompt(profile?.full_name || "No especificado", 100);
    const safeGoal = sanitizeForPrompt(profile?.goal || "No especificado", 200);
    const safeFoodPrefs = sanitizeForPrompt(foodPrefsStr, 500);
    const safeTitle = sanitizeForPrompt(onboardingResponse.onboarding_forms?.title || "Onboarding", 200);
    const safeQaContext = sanitizeForPrompt(qaContext, 8000);

    const prompt = `Eres un entrenador personal y nutricionista experto. Analiza las respuestas del formulario de onboarding de un nuevo cliente y proporciona un informe estructurado.

**Datos del cliente:**
- Nombre: ${safeName}
- Objetivo: ${safeGoal}
- Peso: ${profile?.weight || "No especificado"} kg
- Altura: ${profile?.height || "No especificado"} cm
- Preferencias alimenticias: ${safeFoodPrefs}

**Respuestas del formulario "${safeTitle}":**

${safeQaContext}

**Analiza TODAS las secciones del formulario (historial medico, deportivo, experiencias, estado actual, objetivos y cualquier otra seccion presente). Genera un informe completo en JSON:**
{
  "summary": "resumen ejecutivo del cliente en 2-3 frases",
  "medical_flags": ["lista de señales medicas relevantes (patologias, medicacion, lesiones)"],
  "risk_flags": ["lista de posibles riesgos o señales de alerta para el entrenamiento"],
  "strengths": ["puntos fuertes del cliente (experiencia, motivacion, disponibilidad)"],
  "experience_level": "principiante|intermedio|avanzado",
  "recommendations": {
    "training": "recomendaciones de entrenamiento especificas basadas en TODO el historial",
    "nutrition": "recomendaciones nutricionales especificas",
    "lifestyle": "recomendaciones de estilo de vida (sueno, estres, habitos)",
    "precautions": "precauciones por lesiones, patologias o medicacion"
  },
  "suggested_goal_kcal": number,
  "suggested_protein_g": number,
  "suggested_training_days": number,
  "priority_focus": "fuerza|hipertrofia|perdida de grasa|resistencia|salud general",
  "notes": "notas adicionales para el entrenador"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const result = await response.json();
    const textContent = result.content?.[0]?.text || "{}";

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: textContent };

    // Guardar el analisis en la respuesta del onboarding
    await supabase
      .from("onboarding_responses")
      .update({ ai_analysis: analysis, analyzed_at: new Date().toISOString() })
      .eq("id", response_id);

    return new Response(JSON.stringify(analysis), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return new Response(
      JSON.stringify({ error: "Error al analizar el formulario" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
