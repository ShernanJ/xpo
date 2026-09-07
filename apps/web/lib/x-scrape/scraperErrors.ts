import type { ScraperProxyAccountStatus } from "../generated/prisma/client.ts";

const REVERSIBLE_FORBIDDEN_PATTERNS = [
  /auth/i,
  /challenge/i,
  /checkpoint/i,
  /confirm/i,
  /email/i,
  /login/i,
  /phone/i,
  /temporar/i,
  /unusual activity/i,
  /verify/i,
];

export class RateLimitError extends Error {
  accountId: string | null;
  statusCode: number;

  constructor(message: string, accountId: string | null, statusCode = 429) {
    super(message);
    this.name = "RateLimitError";
    this.accountId = accountId;
    this.statusCode = statusCode;
  }
}

export class SessionDeadError extends Error {
  accountId: string | null;
  accountStatus: Extract<ScraperProxyAccountStatus, "LOCKED" | "BANNED">;
  statusCode: number;

  constructor(
    message: string,
    accountId: string | null,
    accountStatus: Extract<ScraperProxyAccountStatus, "LOCKED" | "BANNED">,
    statusCode: number,
  ) {
    super(message);
    this.name = "SessionDeadError";
    this.accountId = accountId;
    this.accountStatus = accountStatus;
    this.statusCode = statusCode;
  }
}

export class NoHealthySessionError extends Error {
  attemptedAccountIds: string[];

  constructor(message = "No healthy scraper accounts are currently available.", attemptedAccountIds: string[] = []) {
    super(message);
    this.name = "NoHealthySessionError";
    this.attemptedAccountIds = attemptedAccountIds;
  }
}

export function classifyForbiddenAccountStatus(
  bodyPreview: string,
): Extract<ScraperProxyAccountStatus, "LOCKED" | "BANNED"> {
  return REVERSIBLE_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(bodyPreview))
    ? "LOCKED"
    : "BANNED";
}

export function isScraperPoolRetryableError(error: unknown): boolean {
  return error instanceof RateLimitError || error instanceof NoHealthySessionError;
}
