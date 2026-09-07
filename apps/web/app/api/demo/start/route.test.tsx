import { describe, expect, test, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createDemoWorkspace: vi.fn(),
  createSessionToken: vi.fn(),
  capturePostHogServerEvent: vi.fn(),
}));

vi.mock("@/lib/security/rateLimit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));

vi.mock("@/lib/security/requestValidation", () => ({
  buildErrorResponse: ({
    status,
    field,
    message,
    extras,
  }: {
    status: number;
    field: string;
    message: string;
    extras?: Record<string, unknown>;
  }) =>
    Response.json(
      {
        ok: false,
        ...(extras ?? {}),
        errors: [{ field, message }],
      },
      { status },
    ),
  getRequestIp: () => "127.0.0.1",
}));

vi.mock("@/lib/demo/workspace", () => ({
  createDemoWorkspace: mocks.createDemoWorkspace,
}));

vi.mock("@/lib/auth/session", () => ({
  createSessionToken: mocks.createSessionToken,
  SESSION_COOKIE_NAME: "sx_session",
  SESSION_MAX_AGE_SECONDS: 7776000,
}));

vi.mock("@/lib/posthog/server", () => ({
  capturePostHogServerEvent: mocks.capturePostHogServerEvent,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.consumeRateLimit.mockResolvedValue({ ok: true });
  mocks.createDemoWorkspace.mockResolvedValue({
    userId: "demo_123",
    xHandle: "mayaops",
    runId: "or_demo_123",
  });
  mocks.createSessionToken.mockResolvedValue("demo-session-token");
  mocks.capturePostHogServerEvent.mockResolvedValue(undefined);
});

describe("GET /api/demo/start", () => {
  test("creates a demo workspace, sets the app session cookie, and redirects to chat", async () => {
    const response = await GET(
      new Request("https://xpo.lol/api/demo/start", {
        headers: {
          "user-agent": "vitest",
        },
      }) as never,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://xpo.lol/chat?xHandle=mayaops");
    expect(response.headers.get("set-cookie")).toContain("sx_session=demo-session-token");
    expect(mocks.createDemoWorkspace).toHaveBeenCalledWith("vitest");
    expect(mocks.capturePostHogServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: "demo_123",
        event: "xpo_demo_workspace_started",
      }),
    );
  });

  test("rate limits demo session creation by IP", async () => {
    mocks.consumeRateLimit.mockResolvedValue({
      ok: false,
      retryAfterSeconds: 60,
    });

    const response = await GET(new Request("https://xpo.lol/api/demo/start") as never);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.errors[0].message).toMatch(/too many demo sessions/i);
    expect(mocks.createDemoWorkspace).not.toHaveBeenCalled();
  });

  test("returns a friendly setup error when the database is unavailable", async () => {
    mocks.consumeRateLimit.mockRejectedValue(
      new Error("(ENOTFOUND) tenant/user postgres.demo not found"),
    );

    const response = await GET(new Request("https://xpo.lol/api/demo/start"));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.code).toBe("DEMO_DATABASE_UNAVAILABLE");
    expect(payload.errors[0].message).toMatch(/DATABASE_URL/i);
    expect(mocks.createDemoWorkspace).not.toHaveBeenCalled();
  });

  test("returns a friendly setup error when session signing is unavailable", async () => {
    mocks.createSessionToken.mockRejectedValue(new Error("SESSION_SECRET env var is not set."));

    const response = await GET(new Request("https://xpo.lol/api/demo/start"));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.code).toBe("DEMO_SESSION_UNAVAILABLE");
    expect(payload.errors[0].message).toMatch(/SESSION_SECRET/i);
  });
});
