import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendAppointmentEmail, type AppointmentEmailData } from "./email-notifications";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const APPOINTMENT_DATA: AppointmentEmailData = {
  to: "cliente@test.com",
  recipientName: "Juan García",
  trainerName: "Carlos López",
  clientName: "Juan García",
  appointmentTitle: "Sesión de fuerza",
  sessionType: "presencial",
  startsAt: new Date("2026-03-25T10:00:00"),
  endsAt: new Date("2026-03-25T11:00:00"),
  location: "Gym Center",
  notes: "Traer toalla",
  status: "confirmed",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendAppointmentEmail", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  // 1. Returns false when RESEND_API_KEY is not configured
  it("returns { sent: false } when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await sendAppointmentEmail(APPOINTMENT_DATA);

    expect(result.sent).toBe(false);
    expect(result.error).toContain("RESEND_API_KEY");
  });

  // 2. Returns false when RESEND_API_KEY is undefined
  it("returns { sent: false } when RESEND_API_KEY is undefined", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendAppointmentEmail(APPOINTMENT_DATA);

    expect(result.sent).toBe(false);
    expect(result.error).toBeDefined();
  });

  // 3. Does not throw on any status variant
  it("handles all status variants without throwing", async () => {
    for (const status of ["confirmed", "cancelled", "pending"] as const) {
      const data = { ...APPOINTMENT_DATA, status };
      const result = await sendAppointmentEmail(data);
      expect(result).toBeDefined();
      expect(result.sent).toBe(false); // Resend not configured
    }
  });

  // 4. Returns error string, not an exception
  it("returns an error string, does not throw", async () => {
    const result = await sendAppointmentEmail(APPOINTMENT_DATA);

    expect(typeof result.error).toBe("string");
    expect(result.sent).toBe(false);
  });
});
