// Google Calendar OAuth integration
// Configurar las siguientes variables de entorno:
//   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<tu_client_id>
//   GOOGLE_CLIENT_SECRET=<tu_client_secret>
//   NEXT_PUBLIC_GOOGLE_REDIRECT_URI=<tu_redirect_uri> (ej: https://tu-dominio.com/api/auth/google/callback)

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

/**
 * Genera la URL de autorización de Google OAuth
 * Redirige al usuario a Google para autorizar el acceso al calendario
 */
export function getGoogleAuthUrl(state?: string): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      "Google Calendar: NEXT_PUBLIC_GOOGLE_CLIENT_ID y NEXT_PUBLIC_GOOGLE_REDIRECT_URI deben estar configurados"
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por tokens de acceso
 * Llamar desde una API Route (server-side)
 */
export async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google Calendar: credenciales no configuradas");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }>;
}

/**
 * Refresca el token de acceso usando el refresh_token
 */
export async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar: credenciales no configuradas");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google access token");
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

/**
 * Crea un evento en Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    colorId?: string;
    reminders?: {
      useDefault: boolean;
      overrides?: { method: string; minutes: number }[];
    };
  }
) {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar createEvent failed: ${error}`);
  }

  return response.json();
}

/**
 * Lista los eventos del calendario en un rango de fechas
 */
export async function listCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  maxResults = 50
) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to list Google Calendar events");
  }

  return response.json();
}

/**
 * Elimina un evento del calendario
 */
export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete Google Calendar event");
  }
}

/**
 * Helper: Crear evento de entrenamiento en el calendario
 */
export async function syncWorkoutToCalendar(
  accessToken: string,
  workout: {
    title: string;
    date: string; // YYYY-MM-DD
    startHour?: number; // default 9
    durationMinutes?: number; // default 60
    exercises?: string[];
    timeZone?: string;
  }
) {
  const tz = workout.timeZone || "Europe/Madrid";
  const hour = workout.startHour ?? 9;
  const duration = workout.durationMinutes ?? 60;

  const startTime = `${workout.date}T${String(hour).padStart(2, "0")}:00:00`;
  const endHour = hour + Math.floor(duration / 60);
  const endMinute = duration % 60;
  const endTime = `${workout.date}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`;

  return createCalendarEvent(accessToken, {
    summary: `💪 ${workout.title}`,
    description: workout.exercises
      ? `Ejercicios:\n${workout.exercises.map((e) => `• ${e}`).join("\n")}`
      : undefined,
    start: { dateTime: startTime, timeZone: tz },
    end: { dateTime: endTime, timeZone: tz },
    colorId: "7", // Peacock (blue-green)
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 30 }],
    },
  });
}

/**
 * Helper: Sincronizar una cita con Google Calendar
 * PENDIENTE: Requiere OAuth 2.0 configurado (NEXT_PUBLIC_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
 * y tokens almacenados en Supabase Vault por entrenador.
 * Una vez configurado el OAuth, llamar con el accessToken del trainer desde una API Route.
 */
export async function syncAppointmentToCalendar(
  accessToken: string,
  appointment: {
    title: string;
    starts_at: string; // ISO string
    ends_at: string;   // ISO string
    session_type: string;
    notes?: string;
    location?: string;
    meeting_url?: string;
    client_name?: string;
    timeZone?: string;
  }
) {
  const tz = appointment.timeZone || "Europe/Madrid";

  const typeLabels: Record<string, string> = {
    presencial: "Sesión presencial",
    online: "Sesión online",
    telefonica: "Llamada telefónica",
    evaluacion: "Evaluación inicial",
    seguimiento: "Seguimiento",
  };

  const description = [
    appointment.client_name ? `Cliente: ${appointment.client_name}` : null,
    typeLabels[appointment.session_type] ?? appointment.session_type,
    appointment.notes ? `Notas: ${appointment.notes}` : null,
    appointment.meeting_url ? `Enlace: ${appointment.meeting_url}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return createCalendarEvent(accessToken, {
    summary: `📅 ${appointment.title}`,
    description,
    start: { dateTime: appointment.starts_at, timeZone: tz },
    end: { dateTime: appointment.ends_at, timeZone: tz },
    colorId: "2", // Sage (green)
    ...(appointment.location ? { location: appointment.location } : {}),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "email", minutes: 1440 }, // 24h antes
      ],
    },
  });
}

/**
 * Helper: Crear evento de comida en el calendario
 */
export async function syncMealToCalendar(
  accessToken: string,
  meal: {
    mealType: string;
    date: string; // YYYY-MM-DD
    foods?: string[];
    kcal?: number;
    timeZone?: string;
  }
) {
  const tz = meal.timeZone || "Europe/Madrid";

  const mealTimes: Record<string, number> = {
    desayuno: 8,
    almuerzo: 11,
    comida: 14,
    merienda: 17,
    cena: 21,
    snack: 16,
  };

  const hour = mealTimes[meal.mealType] ?? 12;
  const startTime = `${meal.date}T${String(hour).padStart(2, "0")}:00:00`;
  const endTime = `${meal.date}T${String(hour).padStart(2, "0")}:30:00`;

  return createCalendarEvent(accessToken, {
    summary: `🍽️ ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}${meal.kcal ? ` (${meal.kcal} kcal)` : ""}`,
    description: meal.foods
      ? `Alimentos:\n${meal.foods.map((f) => `• ${f}`).join("\n")}`
      : undefined,
    start: { dateTime: startTime, timeZone: tz },
    end: { dateTime: endTime, timeZone: tz },
    colorId: "6", // Tangerine (orange)
  });
}
