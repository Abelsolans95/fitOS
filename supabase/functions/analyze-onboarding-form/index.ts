// Edge Function: analyze-onboarding-form
// Analiza las respuestas del formulario de onboarding de un cliente con IA
// POST /functions/v1/analyze-onboarding-form
// Body: { client_id, response_id }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } }
    );

    const { client_id, response_id } = await req.json();

    if (!client_id || !response_id) {
      return new Response(
        JSON.stringify({ error: "client_id and response_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener perfil del cliente
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, goal, weight_kg, height_cm, food_preferences")
      .eq("user_id", client_id)
      .single();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY no configurada",
          message: "Configura la API key de Anthropic para análisis con IA.",
          mock: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formFields = onboardingResponse.onboarding_forms?.fields || [];
    const answers = onboardingResponse.answers || {};

    // Construir contexto legible de preguntas/respuestas
    const qaContext = formFields
      .map((field: { label: string; id: string }) => {
        const answer = answers[field.id];
        return `P: ${field.label}\nR: ${answer ?? "(sin respuesta)"}`;
      })
      .join("\n\n");

    const prompt = `Eres un entrenador personal y nutricionista experto. Analiza las respuestas del formulario de onboarding de un nuevo cliente y proporciona un informe estructurado.

**Datos del cliente:**
- Nombre: ${profile?.full_name || "No especificado"}
- Objetivo: ${profile?.goal || "No especificado"}
- Peso: ${profile?.weight_kg || "No especificado"} kg
- Altura: ${profile?.height_cm || "No especificado"} cm
- Preferencias alimenticias: ${profile?.food_preferences || "No especificadas"}

**Respuestas del formulario "${onboardingResponse.onboarding_forms?.title || "Onboarding"}":**

${qaContext}

**Genera un informe en JSON:**
{
  "summary": "resumen ejecutivo del cliente en 2-3 frases",
  "risk_flags": ["lista de posibles riesgos o señales de alerta"],
  "strengths": ["puntos fuertes del cliente"],
  "recommendations": {
    "training": "recomendaciones de entrenamiento específicas",
    "nutrition": "recomendaciones nutricionales específicas",
    "lifestyle": "recomendaciones de estilo de vida"
  },
  "suggested_goal_kcal": number,
  "suggested_protein_g": number,
  "suggested_training_days": number,
  "priority_focus": "fuerza|hipertrofia|pérdida de grasa|resistencia|salud general",
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

    // Guardar el análisis en la respuesta del onboarding
    await supabase
      .from("onboarding_responses")
      .update({ ai_analysis: analysis, analyzed_at: new Date().toISOString() })
      .eq("id", response_id);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al analizar el formulario", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
