import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getGoogleAuthUrl,
  syncWorkoutToCalendar,
  syncAppointmentToCalendar,
  syncMealToCalendar,
} from "./google-calendar";

describe("google-calendar", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_REDIRECT_URI", "http://localhost:3000/api/auth/google/callback");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("getGoogleAuthUrl", () => {
    it("returns a valid Google OAuth URL with required params", () => {
      const url = getGoogleAuthUrl();
      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("redirect_uri=");
      expect(url).toContain("response_type=code");
      expect(url).toContain("access_type=offline");
    });

    it("includes state param when provided", () => {
      const url = getGoogleAuthUrl("my-state");
      expect(url).toContain("state=my-state");
    });

    it("throws when env vars are missing", () => {
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
      expect(() => getGoogleAuthUrl()).toThrow("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
    });
  });

  describe("syncWorkoutToCalendar", () => {
    it("creates a calendar event with correct defaults", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "event-1" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await syncWorkoutToCalendar("token-123", {
        title: "Pierna",
        date: "2026-04-02",
        exercises: ["Sentadilla", "Prensa"],
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("calendars/primary/events");
      const body = JSON.parse(opts.body);
      expect(body.summary).toContain("Pierna");
      expect(body.start.dateTime).toBe("2026-04-02T09:00:00");
      expect(body.end.dateTime).toBe("2026-04-02T10:00:00");
      expect(body.description).toContain("Sentadilla");

      vi.unstubAllGlobals();
    });

    it("uses custom start hour and duration", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "event-2" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await syncWorkoutToCalendar("token-123", {
        title: "Pecho",
        date: "2026-04-02",
        startHour: 18,
        durationMinutes: 90,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.start.dateTime).toBe("2026-04-02T18:00:00");
      expect(body.end.dateTime).toBe("2026-04-02T19:30:00");

      vi.unstubAllGlobals();
    });

    it("throws on API error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Unauthorized"),
      }));

      await expect(
        syncWorkoutToCalendar("bad-token", { title: "Test", date: "2026-01-01" })
      ).rejects.toThrow("createEvent failed");

      vi.unstubAllGlobals();
    });
  });

  describe("syncAppointmentToCalendar", () => {
    it("creates appointment event with description", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "event-3" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await syncAppointmentToCalendar("token", {
        title: "Sesión con Juan",
        starts_at: "2026-04-02T10:00:00",
        ends_at: "2026-04-02T11:00:00",
        session_type: "presencial",
        client_name: "Juan Pérez",
        notes: "Primera sesión",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.description).toContain("Juan Pérez");
      expect(body.description).toContain("Sesión presencial");
      expect(body.description).toContain("Primera sesión");

      vi.unstubAllGlobals();
    });
  });

  describe("syncMealToCalendar", () => {
    it("assigns correct time by meal type", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "event-4" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await syncMealToCalendar("token", {
        mealType: "desayuno",
        date: "2026-04-02",
        kcal: 450,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.start.dateTime).toBe("2026-04-02T08:00:00");
      expect(body.summary).toContain("Desayuno");
      expect(body.summary).toContain("450 kcal");

      vi.unstubAllGlobals();
    });
  });
});
