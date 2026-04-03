import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const ALLOWED_NEXT_PATHS = [
  "/app/trainer/dashboard",
  "/app/client/dashboard",
  "/app/admin/dashboard",
  "/app/trainer/settings",
  "/reset-password",
  "/",
];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = ALLOWED_NEXT_PATHS.includes(rawNext) ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Exchange failed — redirect to reset-password with error flag
  return NextResponse.redirect(`${origin}/reset-password?error=link_expired`);
}
