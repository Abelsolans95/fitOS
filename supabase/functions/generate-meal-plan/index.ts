// Edge Function: generate-meal-plan
// Genera un plan de comidas personalizado usando IA basado en datos del cliente
// POST /functions/v1/generate-meal-plan
// Body: { client_id, target_kcal, meals_per_day, period, food_preferences?, restrictions? }

import { authenticateRequest, validateBodySize, sanitizeForPrompt, getCorsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    // SECURITY: Verify JWT and get authenticated user
    const { user, supabase } = await authenticateRequest(req);

    // SECURITY: Only trainers can generate meal plans
    if (user.role !== "trainer") {
      return new Response(
        JSON.stringify({ error: "Solo entrenadores" }),
        { status: 403, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Limit body size
    const bodyText = await validateBodySize(req);
    const { client_id, target_kcal, meals_per_day, period, food_preferences, restrictions } =
      JSON.parse(bodyText);

    if (!client_id || !target_kcal) {
      return new Response(
        JSON.stringify({ error: "client_id and target_kcal are required" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate types
    if (typeof client_id !== "string") {
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

    // Get client profile — correct column names (Rule 12)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, goal, food_preferences, weight, height")
      .eq("user_id", client_id)
      .single();

    // Get trainer's food library
    const { data: foods } = await supabase
      .from("trainer_food_library")
      .select("name, kcal, protein, carbs, fat, fiber, category")
      .or("trainer_id.eq." + encodeURIComponent(user.id) + ",is_global.eq.true")
      .limit(100);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY no configurada",
          message: "Configura la API key de Anthropic para generar menús con IA.",
          mock: true,
        }),
        { status: 503, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Sanitize all user-controlled inputs before prompt interpolation
    const safeName = sanitizeForPrompt(profile?.full_name || "Cliente", 100);
    const safeGoal = sanitizeForPrompt(profile?.goal || "mantenimiento", 200);
    const safePreferences = sanitizeForPrompt(
      food_preferences || (typeof profile?.food_preferences === "string" ? profile.food_preferences : "") || "ninguna especificada",
      500
    );
    const safeRestrictions = sanitizeForPrompt(restrictions || "ninguna", 500);
    const safeKcal = Math.min(Math.max(Number(target_kcal) || 2000, 500), 10000);
    const safeMeals = Math.min(Math.max(Number(meals_per_day) || 4, 1), 8);
    const safePeriod = sanitizeForPrompt(period || "semanal", 50);

    const prompt = `Eres un nutricionista deportivo experto. Genera un plan de comidas para:

Cliente: ${safeName}
Objetivo: ${safeGoal}
Peso: ${profile?.weight || "no especificado"} kg
Preferencias alimenticias: ${safePreferences}
Restricciones: ${safeRestrictions}
Calorías objetivo: ${safeKcal} kcal/día
Comidas por día: ${safeMeals}
Periodo: ${safePeriod}

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

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: textContent };

    return new Response(JSON.stringify(parsed), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return new Response(
      JSON.stringify({ error: "Error al generar el menú" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
