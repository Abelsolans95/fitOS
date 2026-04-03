import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { requireAuth, requireDbRole, errorResponse } from "@/lib/api-utils";

// GET /api/auth/google/callback — Recibe el código de Google y guarda los tokens
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const returnTo = state || "/app/client/calendar";
      return NextResponse.redirect(
        new URL(`${returnTo}?google_error=${error}`, request.url)
      );
    }

    if (!code) {
      return errorResponse("No authorization code received", 400);
    }

    // Intercambiar código por tokens
    const tokens = await exchangeCodeForTokens(code);

    // Verify authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user, supabase } = authResult;

    // Only trainers can connect Google Calendar (DB role check)
    const dbResult = await requireDbRole(user.id, "trainer");
    if (dbResult instanceof NextResponse) return dbResult;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_calendar_tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        },
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[GoogleOAuth] Error saving tokens:", updateError);
      const returnTo = state || "/app/client/calendar";
      return NextResponse.redirect(
        new URL(`${returnTo}?google_error=token_save_failed`, request.url)
      );
    }

    const returnTo = state || "/app/client/calendar";
    return NextResponse.redirect(
      new URL(`${returnTo}?google_connected=true`, request.url)
    );
  } catch (error) {
    console.error("[GoogleOAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL("/app/client/calendar?google_error=token_exchange_failed", request.url)
    );
  }
}
