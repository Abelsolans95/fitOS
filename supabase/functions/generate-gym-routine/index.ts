// Edge Function: generate-gym-routine
// Genera una rutina de ejercicios personalizada con IA
// POST /functions/v1/generate-gym-routine
// Body: { client_id, goal, duration_months, days_per_week, equipment?, level? }

import { authenticateRequest, validateBodySize, sanitizeForPrompt, getCorsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    // SECURITY: Verify JWT and get authenticated user
    const { user, supabase } = await authenticateRequest(req);

    // SECURITY: Only trainers can generate routines
    if (user.role !== "trainer") {
      return new Response(
        JSON.stringify({ error: "Solo entrenadores" }),
        { status: 403, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Limit body size
    const bodyText = await validateBodySize(req);
    const { client_id, goal, duration_months, days_per_week, equipment, level } =
      JSON.parse(bodyText);

    if (!client_id || !goal) {
      return new Response(
        JSON.stringify({ error: "client_id and goal are required" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate types
    if (typeof client_id !== "string" || typeof goal !== "string") {
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
      .select("full_name, goal, weight, height")
      .eq("user_id", client_id)
      .single();

    // Get available exercises — correct table name (Rule 21)
    const { data: exercises } = await supabase
      .from("trainer_exercise_library")
      .select("name, category")
      .or("trainer_id.eq." + encodeURIComponent(user.id) + ",is_global.eq.true")
      .limit(100);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY no configurada",
          message: "Configura la API key de Anthropic para generar rutinas con IA.",
          mock: true,
        }),
        { status: 503, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Sanitize all user-controlled inputs before prompt interpolation
    const safeGoal = sanitizeForPrompt(goal, 200);
    const safeLevel = sanitizeForPrompt(level || "intermedio", 100);
    const safeEquipment = sanitizeForPrompt(equipment || "gimnasio completo", 200);
    const safeName = sanitizeForPrompt(profile?.full_name || "Cliente", 100);
    const safeDuration = Math.min(Math.max(Number(duration_months) || 3, 1), 24);
    const safeDays = Math.min(Math.max(Number(days_per_week) || 4, 1), 7);

    const prompt = `Eres un entrenador personal certificado con especialización en ${safeGoal}. Diseña una rutina de entrenamiento para:

Cliente: ${safeName}
Objetivo: ${safeGoal}
Nivel: ${safeLevel}
Peso: ${profile?.weight || "no especificado"} kg
Duración: ${safeDuration} meses
Días por semana: ${safeDays}
Equipamiento disponible: ${safeEquipment}

Ejercicios disponibles:
${exercises?.map((e) => `- ${e.name} (${e.category || "general"})`).join("\n") || "Usar ejercicios estándar"}

Genera la rutina completa en JSON:
{
  "title": "nombre de la rutina",
  "goal": "${safeGoal}",
  "duration_months": ${safeDuration},
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
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Don't leak error details — only if it's already a Response (from auth), rethrow
    if (error instanceof Response) throw error;
    return new Response(
      JSON.stringify({ error: "Error al generar la rutina" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
