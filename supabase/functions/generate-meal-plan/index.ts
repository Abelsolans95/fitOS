// Edge Function: generate-meal-plan
// Genera un plan de comidas personalizado usando IA basado en datos del cliente
// POST /functions/v1/generate-meal-plan
// Body: { client_id, target_kcal, meals_per_day, period, food_preferences?, restrictions? }

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

    const { client_id, target_kcal, meals_per_day, period, food_preferences, restrictions } =
      await req.json();

    if (!client_id || !target_kcal) {
      return new Response(
        JSON.stringify({ error: "client_id and target_kcal are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener perfil del cliente
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, goal, food_preferences, weight_kg, height_cm")
      .eq("user_id", client_id)
      .single();

    // Obtener biblioteca de alimentos del entrenador
    const { data: { user } } = await supabase.auth.getUser();
    const { data: foods } = await supabase
      .from("trainer_food_library")
      .select("name, kcal, protein, carbs, fat, fiber, category")
      .or(`trainer_id.eq.${user?.id},is_global.eq.true`)
      .limit(100);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY no configurada",
          message: "Configura la API key de Anthropic para generar menús con IA.",
          mock: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Eres un nutricionista deportivo experto. Genera un plan de comidas para:

Cliente: ${profile?.full_name || "Cliente"}
Objetivo: ${profile?.goal || "mantenimiento"}
Peso: ${profile?.weight_kg || "no especificado"} kg
Preferencias alimenticias: ${food_preferences || profile?.food_preferences || "ninguna especificada"}
Restricciones: ${restrictions || "ninguna"}
Calorías objetivo: ${target_kcal} kcal/día
Comidas por día: ${meals_per_day || 4}
Periodo: ${period || "semanal"}

Alimentos disponibles en biblioteca:
${foods?.map((f) => `- ${f.name} (${f.kcal} kcal, P:${f.protein}g C:${f.carbs}g G:${f.fat}g)`).join("\n") || "Usar alimentos genéricos"}

Genera un plan completo en JSON:
{
  "days": [
    {
      "day": "Lunes",
      "meals": [
        {
          "label": "Desayuno",
          "foods": [{"name": "string", "portion_g": number, "kcal": number, "protein": number, "carbs": number, "fat": number}],
          "total_kcal": number
        }
      ],
      "total_kcal": number
    }
  ],
  "weekly_avg_kcal": number,
  "notes": "consejos adicionales"
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

    // Intentar parsear JSON de la respuesta
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: textContent };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al generar el menú", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
