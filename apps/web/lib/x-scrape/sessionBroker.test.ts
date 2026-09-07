import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    scraperProxyAccount: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(),
    scraperProxyAccount: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    prisma,
    tx,
    send: vi.fn(),
  };
});

vi.mock("../db.ts", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../generated/prisma/client.ts", () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings: Array.from(strings),
      values,
    }),
    empty: { __empty: true },
  },
}));

vi.mock("../inngest/client.ts", () => ({
  inngest: {
    send: mocks.send,
  },
}));

import {
  SCRAPER_RATE_LIMIT_COOLDOWN_MS,
  getHealthySession,
  getScraperAccountDebugSnapshot,
  handleScraperResponseFailure,
} from "./sessionBroker.ts";
import {
  NoHealthySessionError,
  RateLimitError,
  SessionDeadError,
} from "./scraperErrors.ts";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => unknown) =>
    callback(mocks.tx),
  );
  mocks.tx.$queryRaw.mockResolvedValue([]);
  mocks.prisma.scraperProxyAccount.findMany.mockResolvedValue([]);
  mocks.prisma.scraperProxyAccount.update.mockResolvedValue(undefined);
  mocks.tx.scraperProxyAccount.findUnique.mockResolvedValue(null);
  mocks.tx.scraperProxyAccount.update.mockResolvedValue(undefined);
  mocks.send.mockResolvedValue(undefined);
});

describe("sessionBroker", () => {
  test("returns the selected healthy scraper account as a cookie-backed session", async () => {
    mocks.tx.$queryRaw.mockResolvedValue([
      {
        id: "acct_1",
        username: "pool-alpha",
        authToken: "auth-token-1",
        ct0: "csrf-token-1",
        status: "ACTIVE",
        cooldownUntil: null,
        lastUsedAt: new Date("2026-04-05T12:00:00.000Z"),
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        updatedAt: new Date("2026-04-05T12:00:00.000Z"),
      },
    ]);

    const session = await getHealthySession();

    expect(session).toMatchObject({
      kind: "pooled",
      label: "pool-alpha",
      accountId: "acct_1",
      username: "pool-alpha",
      cookie: "auth_token=auth-token-1; ct0=csrf-token-1",
      csrfToken: "csrf-token-1",
    });
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  test("throws when no healthy scraper accounts are available", async () => {
    await expect(getHealthySession()).rejects.toBeInstanceOf(NoHealthySessionError);
  });

  test("reads the scraper account debug snapshot directly from Prisma", async () => {
    mocks.prisma.scraperProxyAccount.findMany.mockResolvedValue([
      {
        id: "acct_1",
        username: "alpha",
        status: "ACTIVE",
        lastUsedAt: new Date("2026-04-05T12:00:00.000Z"),
        cooldownUntil: null,
      },
      {
        id: "acct_2",
        username: "beta",
        status: "RATE_LIMITED",
        lastUsedAt: new Date("2026-04-05T12:05:00.000Z"),
        cooldownUntil: new Date("2026-04-05T12:20:00.000Z"),
      },
    ]);

    const snapshot = await getScraperAccountDebugSnapshot();

    expect(mocks.prisma.scraperProxyAccount.findMany).toHaveBeenCalledWith({
      orderBy: [{ status: "asc" }, { lastUsedAt: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        status: true,
        lastUsedAt: true,
        cooldownUntil: true,
      },
    });
    expect(snapshot.accounts).toEqual([
      {
        id: "acct_1",
        username: "alpha",
        status: "ACTIVE",
        lastUsedAt: "2026-04-05T12:00:00.000Z",
        cooldownUntil: null,
      },
      {
        id: "acct_2",
        username: "beta",
        status: "RATE_LIMITED",
        lastUsedAt: "2026-04-05T12:05:00.000Z",
        cooldownUntil: "2026-04-05T12:20:00.000Z",
      },
    ]);
  });

  test("marks 429 responses as rate limited for 15 minutes", async () => {
    const before = Date.now();

    await expect(
      handleScraperResponseFailure({
        accountId: "acct_1",
        status: 429,
        bodyPreview: "Too many requests",
        context: "UserTweets",
      }),
    ).rejects.toBeInstanceOf(RateLimitError);

    expect(mocks.prisma.scraperProxyAccount.update).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.scraperProxyAccount.update).toHaveBeenCalledWith({
      where: { id: "acct_1" },
      data: {
        status: "RATE_LIMITED",
        cooldownUntil: expect.any(Date),
      },
    });

    const cooldownUntil = mocks.prisma.scraperProxyAccount.update.mock.calls[0]?.[0]?.data
      ?.cooldownUntil as Date;
    expect(cooldownUntil.getTime()).toBeGreaterThanOrEqual(before + SCRAPER_RATE_LIMIT_COOLDOWN_MS - 50);
  });

  test("marks reversible 403 responses as locked and dispatches a recovery event", async () => {
    mocks.tx.scraperProxyAccount.findUnique.mockResolvedValue({
      status: "ACTIVE",
    });

    await expect(
      handleScraperResponseFailure({
        accountId: "acct_1",
        status: 403,
        bodyPreview: "Account challenge required before continuing.",
        context: "SearchTimeline",
      }),
    ).rejects.toBeInstanceOf(SessionDeadError);

    expect(mocks.tx.scraperProxyAccount.update).toHaveBeenCalledWith({
      where: { id: "acct_1" },
      data: {
        status: "LOCKED",
        cooldownUntil: null,
      },
    });
    expect(mocks.send).toHaveBeenCalledWith({
      name: "scraper/account.locked",
      data: {
        accountId: "acct_1",
        status: "LOCKED",
      },
    });
  });

  test("marks non-reversible 403 responses as banned", async () => {
    mocks.tx.scraperProxyAccount.findUnique.mockResolvedValue({
      status: "ACTIVE",
    });

    await expect(
      handleScraperResponseFailure({
        accountId: "acct_9",
        status: 403,
        bodyPreview: "Forbidden by upstream policy.",
        context: "SearchTimeline",
      }),
    ).rejects.toMatchObject({
      accountId: "acct_9",
      accountStatus: "BANNED",
    });

    expect(mocks.tx.scraperProxyAccount.update).toHaveBeenCalledWith({
      where: { id: "acct_9" },
      data: {
        status: "BANNED",
        cooldownUntil: null,
      },
    });
  });
});
