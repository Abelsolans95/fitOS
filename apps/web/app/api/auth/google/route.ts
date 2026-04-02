import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";
import { requireAuth, requireMetadataRole, errorResponse } from "@/lib/api-utils";

// GET /api/auth/google — Redirige al flujo OAuth de Google (solo trainers)
export async function GET(request: Request) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;
    const { user } = result;

    // Google Calendar sync is trainer-only
    const roleCheck = requireMetadataRole(user, "trainer");
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get("returnTo") || "/app/trainer/appointments";

    const authUrl = getGoogleAuthUrl(returnTo);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return errorResponse(
      "Google Calendar no configurado. Añade NEXT_PUBLIC_GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
      500
    );
  }
}
