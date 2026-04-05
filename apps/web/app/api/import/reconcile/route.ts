import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { validateCsrf } from "@/lib/csrf";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";

const MAX_EXERCISE_NAMES = 200;

interface SimilarExerciseMatch {
  id: string;
  name: string;
  is_global: boolean;
  similarity: number;
}

export async function POST(request: NextRequest) {
  // SECURITY: CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // SECURITY: Rate limiting
  const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
  if (!success) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  // Verify trainer role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || profile?.role !== "trainer") {
    return NextResponse.json({ error: "Solo entrenadores" }, { status: 403 });
  }

  const body = await request.json();
  const { import_id, exercise_names } = body as {
    import_id: string;
    exercise_names: string[];
  };

  // SECURITY: Runtime type validation
  if (!import_id || typeof import_id !== "string") {
    return NextResponse.json({ error: "import_id requerido" }, { status: 400 });
  }
  if (!Array.isArray(exercise_names) || exercise_names.length === 0) {
    return NextResponse.json({ error: "exercise_names debe ser un array no vacío" }, { status: 400 });
  }
  // SECURITY: Cap array size to prevent DoS via mass RPC calls
  if (exercise_names.length > MAX_EXERCISE_NAMES) {
    return NextResponse.json({ error: `Máximo ${MAX_EXERCISE_NAMES} ejercicios por reconciliación` }, { status: 400 });
  }
  if (exercise_names.some((n: unknown) => typeof n !== "string")) {
    return NextResponse.json({ error: "exercise_names debe contener solo strings" }, { status: 400 });
  }

  // Search similar exercises for each name
  const results = await Promise.all(
    exercise_names.map(async (name) => {
      const { data: matches, error } = await supabase.rpc(
        "search_similar_exercises",
        {
          search_term: name,
          p_trainer_id: user.id,
          similarity_threshold: 0.2,
          max_results: 5,
        }
      );

      if (error) {
        return {
          original_name: name,
          matches: [],
          best_match: null,
          confidence: 0,
          status: "no_match" as const,
        };
      }

      const sortedMatches = ((matches ?? []) as SimilarExerciseMatch[]).sort(
        (a, b) => b.similarity - a.similarity
      );
      const best = sortedMatches[0] || null;

      return {
        original_name: name,
        matches: sortedMatches.map((m) => ({
          id: m.id,
          name: m.name,
          is_global: m.is_global,
          similarity: Math.round(m.similarity * 100) / 100,
        })),
        best_match: best
          ? {
              id: best.id,
              name: best.name,
              similarity: Math.round(best.similarity * 100) / 100,
            }
          : null,
        confidence: best ? Math.round(best.similarity * 100) / 100 : 0,
        status:
          best && best.similarity > 0.8
            ? ("auto_matched" as const)
            : best && best.similarity > 0.5
              ? ("review" as const)
              : ("no_match" as const),
      };
    })
  );

  // SECURITY: verify import belongs to this trainer before updating
  const { data: importRec } = await supabase
    .from("excel_imports")
    .select("trainer_id")
    .eq("id", import_id)
    .single();

  if (!importRec || importRec.trainer_id !== user.id) {
    return NextResponse.json({ error: "Import no autorizado" }, { status: 403 });
  }

  // Update import record status
  const { error: updateError } = await supabase
    .from("excel_imports")
    .update({ status: "mapped" })
    .eq("id", import_id);

  if (updateError) {
    console.error("[import/reconcile] Error updating excel_imports:", updateError);
    // No bloqueante — la reconciliación ya se completó
  }

  return NextResponse.json({
    import_id,
    reconciliation: results,
    summary: {
      total: results.length,
      auto_matched: results.filter((r) => r.status === "auto_matched").length,
      needs_review: results.filter((r) => r.status === "review").length,
      no_match: results.filter((r) => r.status === "no_match").length,
    },
  });
}
