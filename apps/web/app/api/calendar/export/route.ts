import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";
import ical, { ICalEventStatus } from "ical-generator";

const APPOINTMENT_COLUMNS =
  "id, trainer_id, client_id, title, description, starts_at, ends_at, status, location, meeting_url" as const;

type AppointmentRow = {
  id: string;
  trainer_id: string;
  client_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  location: string | null;
  meeting_url: string | null;
};

const STATUS_MAP: Record<string, ICalEventStatus> = {
  confirmed: ICalEventStatus.CONFIRMED,
  pending: ICalEventStatus.TENTATIVE,
  cancelled: ICalEventStatus.CANCELLED,
  completed: ICalEventStatus.CONFIRMED,
};

function getDateRange(range: string): { from: string; to: string } | null {
  const now = new Date();

  if (range === "week") {
    const from = new Date(now);
    from.setDate(from.getDate() - from.getDay());
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  if (range === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  // "all" — no date filter
  return null;
}

/**
 * GET /api/calendar/export
 * Generates an RFC 5545 compliant .ics file with the user's appointments.
 * Query params: ?range=month (default) | week | all
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr ?? !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas peticiones" },
        { status: 429 }
      );
    }

    const role = user.user_metadata?.role as string | undefined;
    if (!role || !["trainer", "client"].includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 403 });
    }

    const rangeParam = request.nextUrl.searchParams.get("range") ?? "month";
    const validRanges = ["week", "month", "all"];
    const range = validRanges.includes(rangeParam) ? rangeParam : "month";
    const dateRange = getDateRange(range);

    // Build query scoped to the user's role
    let query = supabase
      .from("appointments")
      .select(APPOINTMENT_COLUMNS)
      .eq(role === "trainer" ? "trainer_id" : "client_id", user.id)
      .order("starts_at", { ascending: true });

    if (dateRange) {
      query = query
        .gte("starts_at", dateRange.from)
        .lt("starts_at", dateRange.to);
    }

    const { data: appointments, error: apptErr } = await query;

    if (apptErr) {
      console.error("[calendar/export] Error al obtener citas");
      return NextResponse.json(
        { error: "Error al exportar el calendario" },
        { status: 500 }
      );
    }

    const rows = (appointments ?? []) as AppointmentRow[];

    // Generate ICS
    const calendar = ical({
      name: "FitOS — Citas",
      prodId: { company: "FitOS", product: "Calendar Export" },
    });

    for (const appt of rows) {
      const eventData: Parameters<typeof calendar.createEvent>[0] = {
        id: appt.id,
        start: new Date(appt.starts_at),
        end: new Date(appt.ends_at),
        summary: appt.title ?? "Cita FitOS",
        status: STATUS_MAP[appt.status] ?? undefined,
      };

      if (appt.description) {
        eventData.description = appt.description;
      }

      if (appt.location) {
        eventData.location = appt.location;
      }

      if (appt.meeting_url) {
        eventData.url = appt.meeting_url;
      }

      calendar.createEvent(eventData);
    }

    const icsContent = calendar.toString();

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="fitos-calendar.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error inesperado al exportar" },
      { status: 500 }
    );
  }
}
