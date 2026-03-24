import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase-server";

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
      return NextResponse.json(
        { error: "No authorization code received" },
        { status: 400 }
      );
    }

    // Intercambiar código por tokens
    const tokens = await exchangeCodeForTokens(code);

    // Guardar tokens en el perfil del usuario (en Supabase)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          google_calendar_tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
          },
        })
        .eq("user_id", user.id);
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
