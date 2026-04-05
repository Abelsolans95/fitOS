// Edge Function: analyze-food-image
// Recibe una imagen de comida y devuelve estimación de calorías y macros usando IA
// Llamada desde el cliente: POST /functions/v1/analyze-food-image
// Body: { image_base64: string, meal_type?: string }

import { authenticateRequest, validateBodySize, sanitizeForPrompt, getCorsHeaders } from "../_shared/auth.ts";

interface FoodEstimate {
  name: string;
  portion_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: number;
}

interface AnalysisResponse {
  foods: FoodEstimate[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  description: string;
}

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    // SECURITY: Authenticate user (was missing entirely before)
    await authenticateRequest(req);

    // SECURITY: Limit body size (base64 images can be huge — max 7MB = ~5MB image)
    const bodyText = await validateBodySize(req, 7_340_032);
    const { image_base64, meal_type } = JSON.parse(bodyText);

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
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

    // TODO: Integrar con Claude Vision API o GPT-4V para análisis real
    // Por ahora se envía el prompt de análisis y se espera respuesta estructurada
    //
    // El prompt debería ser algo como:
    // "Analiza esta imagen de comida. Identifica cada alimento visible,
    //  estima porciones en gramos, y calcula macronutrientes.
    //  Devuelve JSON con: foods[{name, portion_g, kcal, protein, carbs, fat, fiber, confidence}]"

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      // Devolver respuesta de ejemplo cuando no hay API key configurada
      const mockResponse: AnalysisResponse = {
        foods: [
          {
            name: "Ejemplo: Pechuga de pollo a la plancha",
            portion_g: 150,
            kcal: 248,
            protein: 46.5,
            carbs: 0,
            fat: 5.4,
            fiber: 0,
            confidence: 0.85,
          },
          {
            name: "Ejemplo: Arroz blanco",
            portion_g: 200,
            kcal: 260,
            protein: 5.4,
            carbs: 56.8,
            fat: 0.6,
            fiber: 0.8,
            confidence: 0.9,
          },
        ],
        total_kcal: 508,
        total_protein: 51.9,
        total_carbs: 56.8,
        total_fat: 6.0,
        description:
          "⚠️ Respuesta de ejemplo. Configura ANTHROPIC_API_KEY para análisis real con IA.",
      };

      return new Response(JSON.stringify(mockResponse), {
        status: 503,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Llamada real a Claude Vision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 1024,
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
                text: `Analiza esta imagen de comida${meal_type ? ` (${sanitizeForPrompt(meal_type, 100)})` : ""}. Identifica CADA alimento visible, estima las porciones en gramos y calcula los macronutrientes por cada 100g escalados a la porción.

Responde SOLO con JSON válido (sin markdown):
{
  "foods": [
    {"name": "string", "portion_g": number, "kcal": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "confidence": 0-1}
  ],
  "total_kcal": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "description": "breve descripción del plato"
}`,
              },
            ],
          },
        ],
      }),
    });

    const result = await response.json();
    const textContent = result.content?.[0]?.text || "{}";
    let parsed: AnalysisResponse;
    try {
      parsed = JSON.parse(textContent);
    } catch {
      return new Response(
        JSON.stringify({ error: "Error al procesar respuesta de IA" }),
        { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return new Response(
      JSON.stringify({ error: "Error al analizar la imagen" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
