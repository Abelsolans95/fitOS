// Edge Function: generate-gym-routine
// Genera una rutina de ejercicios personalizada con IA
// POST /functions/v1/generate-gym-routine
// Body: { client_id, goal, duration_months, days_per_week, equipment?, level? }

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

    const { client_id, goal, duration_months, days_per_week, equipment, level } =
      await req.json();

    if (!client_id || !goal) {
      return new Response(
        JSON.stringify({ error: "client_id and goal are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener perfil del cliente
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, goal, weight_kg, height_cm")
      .eq("user_id", client_id)
      .single();

    // Obtener ejercicios disponibles
    const { data: { user } } = await supabase.auth.getUser();
    const { data: exercises } = await supabase
      .from("exercises")
      .select("name, category, primary_muscles, equipment, difficulty")
      .or(`trainer_id.eq.${user?.id},is_global.eq.true`)
      .limit(100);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY no configurada",
          message: "Configura la API key de Anthropic para generar rutinas con IA.",
          mock: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Eres un entrenador personal certificado con especialización en ${goal}. Diseña una rutina de entrenamiento para:

Cliente: ${profile?.full_name || "Cliente"}
Objetivo: ${goal}
Nivel: ${level || "intermedio"}
Peso: ${profile?.weight_kg || "no especificado"} kg
Duración: ${duration_months || 3} meses
Días por semana: ${days_per_week || 4}
Equipamiento disponible: ${equipment || "gimnasio completo"}

Ejercicios disponibles:
${exercises?.map((e) => `- ${e.name} (${e.category}, ${(e.primary_muscles || []).join(", ")})`).join("\n") || "Usar ejercicios estándar"}

Genera la rutina completa en JSON:
{
  "title": "nombre de la rutina",
  "goal": "${goal}",
  "duration_months": ${duration_months || 3},
  "days": {
    "lunes": {
      "focus": "grupo muscular principal",
      "exercises": [
        {"name": "string", "sets": number, "reps_min": number, "reps_max": number, "rir": number, "rest_s": number, "notes": "string"}
      ]
    }
  },
  "progression_notes": "cómo progresar semana a semana",
  "deload_strategy": "cada cuántas semanas y cómo"
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
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const result = await response.json();
    const textContent = result.content?.[0]?.text || "{}";

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: textContent };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al generar la rutina", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
