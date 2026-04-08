// Edge Function: suggest-meal-from-image
// Receives a fridge/buffet photo + remaining daily macros, returns 2-3 meal suggestions
// POST /functions/v1/suggest-meal-from-image
// Body: { image_base64, remaining_macros: {kcal, protein, carbs, fat}, dietary_preferences?, already_eaten_today?: string[] }

import { authenticateRequest, validateBodySize, sanitizeForPrompt, getCorsHeaders } from "../_shared/auth.ts";

interface RemainingMacros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealSuggestion {
  name: string;
  description: string;
  ingredients: string[];
  estimated_macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  prep_time_min: number;
  difficulty: "facil" | "medio" | "avanzado";
}

interface SuggestMealResponse {
  suggestions: MealSuggestion[];
  identified_items: string[];
  context: string;
}

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    // SECURITY: Authenticate user
    await authenticateRequest(req);

    // SECURITY: Limit body size (base64 images can be large — max 7MB = ~5MB image)
    const bodyText = await validateBodySize(req, 7_340_032);
    const body = JSON.parse(bodyText);

    const {
      image_base64,
      remaining_macros,
      dietary_preferences,
      already_eaten_today,
    } = body as {
      image_base64: string;
      remaining_macros: RemainingMacros;
      dietary_preferences?: string;
      already_eaten_today?: string[];
    };

    // Validate required fields
    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 es obligatorio" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    if (!remaining_macros || typeof remaining_macros.kcal !== "number") {
      return new Response(
        JSON.stringify({ error: "remaining_macros con kcal, protein, carbs, fat es obligatorio" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate base64 length (max ~5MB image)
    if (image_base64.length > 7_000_000) {
      return new Response(
        JSON.stringify({ error: "Imagen demasiado grande (max 5MB)" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Cap already_eaten_today array length
    const eatenToday = Array.isArray(already_eaten_today)
      ? already_eaten_today.slice(0, 20).map((s) => sanitizeForPrompt(String(s), 100))
      : [];

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Funcionalidad IA no disponible. Configura ANTHROPIC_API_KEY en Supabase secrets para activar el analisis con IA.",
          suggestions: [],
          identified_items: [],
          context: "API key no configurada",
        }),
        { status: 503, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt with sanitized user inputs
    const preferencesText = dietary_preferences
      ? `\nPreferencias alimentarias del usuario: ${sanitizeForPrompt(dietary_preferences, 500)}`
      : "";

    const eatenText = eatenToday.length > 0
      ? `\nYa ha comido hoy: ${eatenToday.join(", ")}`
      : "";

    const prompt = `Analiza esta imagen de alimentos disponibles (nevera, buffet, despensa, etc.). Identifica todos los ingredientes y productos visibles.

Luego sugiere 2-3 comidas que se puedan preparar con esos ingredientes y que se ajusten a estos macronutrientes restantes del dia:
- Calorias restantes: ${Math.max(0, Math.round(remaining_macros.kcal))} kcal
- Proteina restante: ${Math.max(0, Math.round(remaining_macros.protein))}g
- Carbohidratos restantes: ${Math.max(0, Math.round(remaining_macros.carbs))}g
- Grasa restante: ${Math.max(0, Math.round(remaining_macros.fat))}g
${preferencesText}${eatenText}

Prioriza comidas que:
1. Usen principalmente los ingredientes visibles en la imagen
2. Se acerquen lo maximo posible a los macros restantes
3. Sean variadas entre si (no sugieras 3 versiones del mismo plato)
4. Sean realistas de preparar en casa

Responde SOLO con JSON valido (sin markdown):
{
  "identified_items": ["ingrediente1", "ingrediente2", ...],
  "suggestions": [
    {
      "name": "Nombre del plato",
      "description": "Breve descripcion de la receta (2-3 frases)",
      "ingredients": ["ingrediente1 (cantidad)", "ingrediente2 (cantidad)", ...],
      "estimated_macros": {"kcal": number, "protein": number, "carbs": number, "fat": number},
      "prep_time_min": number,
      "difficulty": "facil" | "medio" | "avanzado"
    }
  ],
  "context": "Resumen de lo identificado y por que se sugieren estos platos"
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
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: image_base64,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[suggest-meal-from-image] Anthropic API error status:", response.status);
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con el servicio de IA" }),
        { status: 502, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const textContent = result.content?.[0]?.text || "{}";

    // Parse AI response — handle potential JSON within markdown code blocks
    let cleanJson = textContent.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed: SuggestMealResponse = JSON.parse(cleanJson);

    // Validate response shape
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      return new Response(
        JSON.stringify({ error: "La IA no pudo generar sugerencias validas" }),
        { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return new Response(
      JSON.stringify({ error: "Error al procesar la solicitud" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
