import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { import_id, exercise_names } = body as {
    import_id: string;
    exercise_names: string[];
  };

  if (!import_id || !exercise_names?.length) {
    return NextResponse.json(
      { error: "Faltan import_id o exercise_names" },
      { status: 400 }
    );
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

      const sortedMatches = (matches || []).sort(
        (a: any, b: any) => b.similarity - a.similarity
      );
      const best = sortedMatches[0] || null;

      return {
        original_name: name,
        matches: sortedMatches.map((m: any) => ({
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

  // Update import record status
  await supabase
    .from("excel_imports")
    .update({ status: "mapped" })
    .eq("id", import_id);

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
