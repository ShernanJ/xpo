import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}));

import { GET, POST } from "./route";

const originalSecret = process.env.SUPABASE_KEEPALIVE_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  process.env.SUPABASE_KEEPALIVE_SECRET = "test-keepalive-secret";
});

describe("/api/keepalive/supabase", () => {
  test("touches Postgres when called with the bearer secret", async () => {
    const response = await GET(
      new Request("https://xpo.lol/api/keepalive/supabase", {
        headers: {
          authorization: "Bearer test-keepalive-secret",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
  });

  test("supports simple cron providers that can only pass query params", async () => {
    const response = await POST(
      new Request(
        "https://xpo.lol/api/keepalive/supabase?token=test-keepalive-secret",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
  });

  test("rejects requests without the configured secret", async () => {
    const response = await GET(new Request("https://xpo.lol/api/keepalive/supabase"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.code).toBe("KEEPALIVE_UNAUTHORIZED");
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });

  test("fails closed when the route secret is missing", async () => {
    delete process.env.SUPABASE_KEEPALIVE_SECRET;

    const response = await GET(
      new Request("https://xpo.lol/api/keepalive/supabase?token=test-keepalive-secret"),
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.code).toBe("KEEPALIVE_NOT_CONFIGURED");
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.SUPABASE_KEEPALIVE_SECRET;
  } else {
    process.env.SUPABASE_KEEPALIVE_SECRET = originalSecret;
  }
});
