import { NonRetriableError } from "inngest";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    scraperProxyAccount: {
      findUnique: mocks.findUnique,
    },
  },
}));

import { refreshScraperTokensHandler } from "./refreshScraperTokens";

function createStepTools() {
  return {
    run: vi.fn(async (_stepId: string, fn: () => unknown) => fn()),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("refreshScraperTokensHandler", () => {
  test("loads the account credentials needed for a future refresh flow", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "acct_1",
      username: "pool-alpha",
      password: "secret",
      twoFactorSecret: "2fa-secret",
      authToken: "auth-token",
      ct0: "csrf-token",
      status: "LOCKED",
    });

    const step = createStepTools();
    const result = await refreshScraperTokensHandler({
      event: {
        data: {
          accountId: "acct_1",
          status: "LOCKED",
        },
      },
      step,
    } as never);

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: "acct_1" },
      select: {
        id: true,
        username: true,
        password: true,
        twoFactorSecret: true,
        authToken: true,
        ct0: true,
        status: true,
      },
    });
    expect(result).toMatchObject({
      accountId: "acct_1",
      username: "pool-alpha",
      passwordPresent: true,
      twoFactorSecretPresent: true,
      authTokenPresent: true,
      ct0Present: true,
      status: "LOCKED",
    });
    expect(step.run).toHaveBeenCalledWith("load-scraper-account", expect.any(Function));
  });

  test("fails permanently when the scraper account no longer exists", async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(
      refreshScraperTokensHandler({
        event: {
          data: {
            accountId: "missing",
            status: "BANNED",
          },
        },
        step: createStepTools(),
      } as never),
    ).rejects.toBeInstanceOf(NonRetriableError);
  });
});
