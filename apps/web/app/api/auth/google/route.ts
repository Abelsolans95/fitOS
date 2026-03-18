import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

// GET /api/auth/google — Redirige al flujo OAuth de Google
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get("returnTo") || "/app/client/calendar";

    const authUrl = getGoogleAuthUrl(returnTo);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { error: "Google Calendar no configurado. Añade NEXT_PUBLIC_GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET." },
      { status: 500 }
    );
  }
}
