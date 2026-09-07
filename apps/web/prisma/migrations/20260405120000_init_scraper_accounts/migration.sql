-- This migration intentionally replaces the scraper account pool schema.
-- Reseed all scraper proxy accounts after applying it.

DROP TABLE IF EXISTS "ScraperProxyAccount";

DROP TYPE IF EXISTS "ScraperProxyAccountStatus";

CREATE TYPE "ScraperProxyAccountStatus" AS ENUM (
  'ACTIVE',
  'RATE_LIMITED',
  'LOCKED',
  'BANNED'
);

CREATE TABLE "ScraperProxyAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "twoFactorSecret" TEXT,
    "authToken" TEXT NOT NULL,
    "ct0" TEXT NOT NULL,
    "status" "ScraperProxyAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cooldownUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScraperProxyAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScraperProxyAccount_username_key"
ON "ScraperProxyAccount"("username");

CREATE INDEX "ScraperProxyAccount_status_lastUsedAt_idx"
ON "ScraperProxyAccount"("status", "lastUsedAt");

CREATE INDEX "ScraperProxyAccount_status_cooldownUntil_idx"
ON "ScraperProxyAccount"("status", "cooldownUntil");
