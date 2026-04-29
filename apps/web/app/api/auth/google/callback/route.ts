import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// SECURITY: Whitelist of allowed redirect URLs to prevent open redirect attacks
const ALLOWED_RETURN_URLS = [
  "/app/client/calendar",
  "/app/trainer/appointments",
  "/app/trainer/settings",
];

function sanitizeReturnUrl(state: string | null): string {
  if (state && ALLOWED_RETURN_URLS.includes(state)) return state;
  return "/app/trainer/appointments";
}

// GET /api/auth/google/callback — Recibe el código de Google y guarda los tokens
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const returnTo = sanitizeReturnUrl(state);
      return NextResponse.redirect(
        new URL(`${returnTo}?google_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code received" },
        { status: 400 }
      );
    }

    // SECURITY: Verify caller is authenticated BEFORE exchanging tokens
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // SECURITY: Only trainers can complete Google Calendar OAuth
    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Exchange code for tokens only AFTER verifying auth + role
    const tokens = await exchangeCodeForTokens(code);

    // Save tokens to the authenticated trainer's profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        google_calendar_tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        },
      })
      .eq("user_id", user.id);

    if (updateErr) {
      logger.error("[GoogleOAuth] Error saving tokens");
      return NextResponse.redirect(
        new URL("/app/trainer/appointments?google_error=save_failed", request.url)
      );
    }

    const returnTo = sanitizeReturnUrl(state);
    return NextResponse.redirect(
      new URL(`${returnTo}?google_connected=true`, request.url)
    );
  } catch {
    logger.error("[GoogleOAuth] Callback error");
    return NextResponse.redirect(
      new URL("/app/trainer/appointments?google_error=token_exchange_failed", request.url)
    );
  }
}
