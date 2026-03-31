import { describe, it, expect } from "vitest";
import { deduplicateMessage, buildOptimisticMessage, type Message } from "./useChat";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMessage(id: string, content = "hola"): Message {
  return {
    id,
    trainer_id: "trainer-1",
    client_id: "client-1",
    sender_id: "trainer-1",
    content,
    read_at: null,
    created_at: "2026-03-30T10:00:00.000Z",
  };
}

// ── deduplicateMessage ────────────────────────────────────────────────────────

describe("deduplicateMessage", () => {
  it("appends a new message when id is not present", () => {
    const prev = [makeMessage("m1"), makeMessage("m2")];
    const incoming = makeMessage("m3");
    const result = deduplicateMessage(prev, incoming);
    expect(result).toHaveLength(3);
    expect(result[2].id).toBe("m3");
  });

  it("returns the same array reference when message already exists", () => {
    const prev = [makeMessage("m1"), makeMessage("m2")];
    const duplicate = makeMessage("m1");
    const result = deduplicateMessage(prev, duplicate);
    expect(result).toBe(prev); // same reference — no new array
    expect(result).toHaveLength(2);
  });

  it("works with empty prev list", () => {
    const result = deduplicateMessage([], makeMessage("m1"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });
});

// ── buildOptimisticMessage ────────────────────────────────────────────────────

describe("buildOptimisticMessage", () => {
  it("creates a message with the correct trainerId, clientId, and content", () => {
    const msg = buildOptimisticMessage("trainer-1", "client-1", "Hola entrenador");
    expect(msg.trainer_id).toBe("trainer-1");
    expect(msg.client_id).toBe("client-1");
    expect(msg.sender_id).toBe("client-1"); // client is sender
    expect(msg.content).toBe("Hola entrenador");
    expect(msg.read_at).toBeNull();
  });

  it("generates an id prefixed with opt- followed by digits", () => {
    const msg = buildOptimisticMessage("t", "c", "uno");
    expect(msg.id).toMatch(/^opt-\d+$/);
  });

  it("sets created_at to an ISO timestamp", () => {
    const msg = buildOptimisticMessage("t", "c", "test");
    expect(() => new Date(msg.created_at)).not.toThrow();
    expect(new Date(msg.created_at).toISOString()).toBe(msg.created_at);
  });
});

// ── Message type shape ────────────────────────────────────────────────────────

describe("Message interface", () => {
  it("has all required fields", () => {
    const msg: Message = makeMessage("m1");
    expect(msg).toHaveProperty("id");
    expect(msg).toHaveProperty("trainer_id");
    expect(msg).toHaveProperty("client_id");
    expect(msg).toHaveProperty("sender_id");
    expect(msg).toHaveProperty("content");
    expect(msg).toHaveProperty("read_at");
    expect(msg).toHaveProperty("created_at");
  });
});
