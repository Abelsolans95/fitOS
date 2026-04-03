import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

// GET /api/auth/google — Redirige al flujo OAuth de Google (solo trainers)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Google Calendar sync is trainer-only
    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawReturnTo = searchParams.get("returnTo") || "/app/trainer/appointments";

    // SECURITY: Whitelist redirect URLs to prevent open redirect
    const ALLOWED_RETURNS = ["/app/client/calendar", "/app/trainer/appointments", "/app/trainer/settings"];
    const returnTo = ALLOWED_RETURNS.includes(rawReturnTo) ? rawReturnTo : "/app/trainer/appointments";

    const authUrl = getGoogleAuthUrl(returnTo);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { error: "Google Calendar no configurado. Añade NEXT_PUBLIC_GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET." },
      { status: 500 }
    );
  }
}
