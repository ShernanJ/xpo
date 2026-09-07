import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import pg from "pg";

import { prisma } from "../db.ts";
import {
  Prisma,
  type ScraperProxyAccountStatus,
} from "../generated/prisma/client.ts";
import { inngest } from "../inngest/client.ts";

import {
  NoHealthySessionError,
  RateLimitError,
  SessionDeadError,
  classifyForbiddenAccountStatus,
} from "./scraperErrors.ts";

const { Pool } = pg;

export const DEFAULT_STATE_FILE = path.resolve(
  os.tmpdir(),
  "xpo-scrape",
  "x-http-scrape-state.json",
);
const DEFAULT_STATE_BACKEND = "auto";
const DEFAULT_STATE_TABLE = "x_web_scrape_state";
const DEFAULT_STATE_ROW_ID = "global";
const ACTIVE_STATUS = "ACTIVE";
const RATE_LIMITED_STATUS = "RATE_LIMITED";
const LOCKED_STATUS = "LOCKED";
const BANNED_STATUS = "BANNED";
export const SCRAPER_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;

type DeadScraperAccountStatus = Extract<ScraperProxyAccountStatus, "LOCKED" | "BANNED">;

interface CacheEntry {
  value: string;
  updatedAt: number;
}

interface CacheStore {
  global: Record<string, CacheEntry>;
  userIds: Record<string, CacheEntry>;
}

interface BrokerState {
  cache: CacheStore;
}

interface StateStore {
  backend: "file" | "postgres";
  read(): Promise<BrokerState>;
  write(state: BrokerState): Promise<void>;
  close(): Promise<void | undefined>;
}

interface BrokerAccountRow {
  id: string;
  username: string;
  authToken: string;
  ct0: string;
  status: ScraperProxyAccountStatus;
  cooldownUntil: Date | null;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScraperSessionHandle {
  kind: "pooled" | "default";
  label: string;
  accountId: string | null;
  username: string | null;
  cookie: string | null;
  csrfToken: string | null;
  userAgent: string | null;
  bearerToken: string | null;
}

export interface ScraperAccountDebugEntry {
  id: string;
  username: string;
  status: ScraperProxyAccountStatus;
  lastUsedAt: string;
  cooldownUntil: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function sanitizeSqlIdentifier(identifier: string, label: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid ${label} "${identifier}". Use only letters, numbers, and underscores.`);
  }

  return `"${identifier}"`;
}

export function getCookieValue(cookieString: string, key: string): string | null {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${escapedKey}=([^;]+)`));
  return match ? match[1] : null;
}

export function ensureCookieContainsCt0(cookie: string | null, csrfToken: string | null): string | null {
  if (!cookie) {
    return cookie;
  }

  if (!csrfToken || getCookieValue(cookie, "ct0")) {
    return cookie;
  }

  const separator = cookie.trim().endsWith(";") ? " " : "; ";
  return `${cookie}${separator}ct0=${csrfToken}`;
}

function buildAccountCookie(authToken: string, ct0: string): string {
  return ensureCookieContainsCt0(`auth_token=${authToken}`, ct0) ?? `auth_token=${authToken}; ct0=${ct0}`;
}

function createEmptyBrokerState(): BrokerState {
  return {
    cache: {
      global: {},
      userIds: {},
    },
  };
}

function normalizeCacheEntry(raw: unknown): CacheEntry | null {
  const root = asRecord(raw);
  if (!root || typeof root.value !== "string") {
    return null;
  }

  return {
    value: root.value,
    updatedAt: Number(root.updatedAt) || Date.now(),
  };
}

function normalizeBrokerState(raw: unknown): BrokerState {
  const state = createEmptyBrokerState();
  const root = asRecord(raw);
  if (!root) {
    return state;
  }

  const cache = asRecord(root.cache);
  if (!cache) {
    return state;
  }

  const globalCache = asRecord(cache.global);
  if (globalCache) {
    for (const [key, value] of Object.entries(globalCache)) {
      const entry = normalizeCacheEntry(value);
      if (entry) {
        state.cache.global[key] = entry;
      }
    }
  }

  const userIds = asRecord(cache.userIds);
  if (userIds) {
    for (const [key, value] of Object.entries(userIds)) {
      const entry = normalizeCacheEntry(value);
      if (entry) {
        state.cache.userIds[key] = entry;
      }
    }
  }

  return state;
}

async function readBrokerStateFromFile(statePath: string): Promise<BrokerState> {
  try {
    const raw = await readFile(statePath, "utf8");
    return normalizeBrokerState(JSON.parse(raw));
  } catch {
    return createEmptyBrokerState();
  }
}

async function writeBrokerStateToFile(statePath: string, state: BrokerState): Promise<void> {
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function createFileStateStore(statePath: string): Promise<StateStore> {
  const resolvedStatePath = path.resolve(statePath);
  return {
    backend: "file",
    async read() {
      return readBrokerStateFromFile(resolvedStatePath);
    },
    async write(state) {
      await writeBrokerStateToFile(resolvedStatePath, state);
    },
    async close() {
      return undefined;
    },
  };
}

async function createPostgresStateStore(params: {
  databaseUrl: string | null;
  schemaName: string;
  tableName: string;
  rowId: string;
}): Promise<StateStore> {
  const { databaseUrl, schemaName, tableName, rowId } = params;
  if (!databaseUrl) {
    throw new Error("Postgres scrape state backend requires DATABASE_URL.");
  }

  const schemaIdentifier = sanitizeSqlIdentifier(schemaName, "state schema");
  const tableIdentifier = sanitizeSqlIdentifier(tableName, "state table");
  const qualifiedTable = `${schemaIdentifier}.${tableIdentifier}`;
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaIdentifier}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${qualifiedTable} (
      id TEXT PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return {
    backend: "postgres",
    async read() {
      const result = await pool.query(
        `SELECT state FROM ${qualifiedTable} WHERE id = $1 LIMIT 1`,
        [rowId],
      );
      if (result.rowCount === 0) {
        return createEmptyBrokerState();
      }

      return normalizeBrokerState(result.rows[0]?.state ?? null);
    },
    async write(state) {
      await pool.query(
        `
          INSERT INTO ${qualifiedTable} (id, state, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (id)
          DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
        `,
        [rowId, JSON.stringify(state)],
      );
    },
    async close() {
      await pool.end();
    },
  };
}

async function createBrokerStateStore(params: {
  statePath: string;
  stateBackend: string;
  databaseUrl: string | null;
  stateSchema: string;
  stateTable: string;
  stateRowId: string;
}): Promise<StateStore> {
  const {
    statePath,
    stateBackend,
    databaseUrl,
    stateSchema,
    stateTable,
    stateRowId,
  } = params;
  const normalizedBackend = (stateBackend ?? DEFAULT_STATE_BACKEND).trim().toLowerCase();
  const isProduction = process.env.NODE_ENV === "production";

  const shouldUsePostgres =
    normalizedBackend === "postgres" ||
    (normalizedBackend === "auto" && Boolean(databaseUrl));
  if (shouldUsePostgres) {
    try {
      const stateStore = await createPostgresStateStore({
        databaseUrl,
        schemaName: stateSchema,
        tableName: stateTable,
        rowId: stateRowId,
      });
      console.log(`[state] Using ${stateStore.backend} scrape-state backend.`);
      return stateStore;
    } catch (error) {
      if (normalizedBackend === "postgres" || isProduction) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "unknown error";
      console.warn(
        `[state] Postgres scrape-state backend unavailable (${message}). Falling back to file state.`,
      );
    }
  }

  if (isProduction) {
    throw new Error(
      "Production scraper state requires the Postgres backend. Configure DATABASE_URL or X_WEB_SCRAPE_STATE_BACKEND=postgres.",
    );
  }

  const stateStore = await createFileStateStore(statePath);
  console.log(`[state] Using ${stateStore.backend} scrape-state backend.`);
  return stateStore;
}

function getCacheEntry(cacheMap: Record<string, CacheEntry>, key: string, ttlMs: number): string | null {
  const entry = cacheMap[key];
  if (!entry) {
    return null;
  }

  if (!Number.isFinite(entry.updatedAt) || Date.now() - entry.updatedAt > ttlMs) {
    return null;
  }

  return entry.value;
}

function setCacheEntry(cacheMap: Record<string, CacheEntry>, key: string, value: string): void {
  cacheMap[key] = {
    value,
    updatedAt: Date.now(),
  };
}

function mapDebugEntry(row: {
  id: string;
  username: string;
  status: ScraperProxyAccountStatus;
  lastUsedAt: Date;
  cooldownUntil: Date | null;
}): ScraperAccountDebugEntry {
  return {
    id: row.id,
    username: row.username,
    status: row.status,
    lastUsedAt: row.lastUsedAt.toISOString(),
    cooldownUntil: row.cooldownUntil ? row.cooldownUntil.toISOString() : null,
  };
}

function isDeadStatus(status: ScraperProxyAccountStatus): status is DeadScraperAccountStatus {
  return status === LOCKED_STATUS || status === BANNED_STATUS;
}

async function emitDeadAccountEvent(
  accountId: string,
  status: DeadScraperAccountStatus,
): Promise<void> {
  try {
    await inngest.send({
      name: "scraper/account.locked",
      data: {
        accountId,
        status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[scraper] Failed to dispatch scraper/account.locked for ${accountId}: ${message}`);
  }
}

async function selectHealthyAccount(
  forcedAccountId: string | null,
): Promise<BrokerAccountRow | null> {
  return prisma.$transaction(async (tx) => {
    const forcedFilter = forcedAccountId
      ? Prisma.sql`AND (account."id" = ${forcedAccountId} OR account."username" = ${forcedAccountId})`
      : Prisma.empty;

    const rows = await tx.$queryRaw<BrokerAccountRow[]>(Prisma.sql`
      WITH candidate AS (
        SELECT account."id"
        FROM "ScraperProxyAccount" AS account
        WHERE (
          account."status" = ${ACTIVE_STATUS}::"ScraperProxyAccountStatus"
          OR (
            account."status" = ${RATE_LIMITED_STATUS}::"ScraperProxyAccountStatus"
            AND (
              account."cooldownUntil" IS NULL
              OR account."cooldownUntil" <= NOW()
            )
          )
        )
        ${forcedFilter}
        ORDER BY account."lastUsedAt" ASC, account."createdAt" ASC, account."id" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "ScraperProxyAccount" AS account
      SET
        "lastUsedAt" = NOW(),
        "updatedAt" = NOW(),
        "status" = CASE
          WHEN account."status" = ${RATE_LIMITED_STATUS}::"ScraperProxyAccountStatus"
            AND (
              account."cooldownUntil" IS NULL
              OR account."cooldownUntil" <= NOW()
            )
          THEN ${ACTIVE_STATUS}::"ScraperProxyAccountStatus"
          ELSE account."status"
        END,
        "cooldownUntil" = CASE
          WHEN account."status" = ${RATE_LIMITED_STATUS}::"ScraperProxyAccountStatus"
            AND (
              account."cooldownUntil" IS NULL
              OR account."cooldownUntil" <= NOW()
            )
          THEN NULL
          ELSE account."cooldownUntil"
        END
      FROM candidate
      WHERE account."id" = candidate."id"
      RETURNING
        account."id",
        account."username",
        account."authToken",
        account."ct0",
        account."status",
        account."cooldownUntil",
        account."lastUsedAt",
        account."createdAt",
        account."updatedAt"
    `);

    return rows[0] ?? null;
  });
}

export async function getHealthySession(params: {
  forcedAccountId?: string | null;
} = {}): Promise<ScraperSessionHandle> {
  const forcedAccountId = params.forcedAccountId?.trim() || null;
  const account = await selectHealthyAccount(forcedAccountId);
  if (!account) {
    throw new NoHealthySessionError(
      forcedAccountId
        ? `No healthy scraper account matched "${forcedAccountId}".`
        : "No healthy scraper accounts are currently available.",
    );
  }

  const cookie = buildAccountCookie(account.authToken, account.ct0);
  return {
    kind: "pooled",
    label: account.username,
    accountId: account.id,
    username: account.username,
    cookie,
    csrfToken: account.ct0,
    userAgent: null,
    bearerToken: null,
  };
}

export async function getScraperAccountDebugSnapshot(): Promise<{
  checkedAt: string;
  accounts: ScraperAccountDebugEntry[];
}> {
  const rows = await prisma.scraperProxyAccount.findMany({
    orderBy: [{ status: "asc" }, { lastUsedAt: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      status: true,
      lastUsedAt: true,
      cooldownUntil: true,
    },
  });

  return {
    checkedAt: new Date().toISOString(),
    accounts: rows.map(mapDebugEntry),
  };
}

export async function markScraperAccountRateLimited(
  accountId: string,
  cooldownMs = SCRAPER_RATE_LIMIT_COOLDOWN_MS,
): Promise<Date> {
  const cooldownUntil = new Date(Date.now() + cooldownMs);
  await prisma.scraperProxyAccount.update({
    where: { id: accountId },
    data: {
      status: RATE_LIMITED_STATUS,
      cooldownUntil,
    },
  });
  return cooldownUntil;
}

export async function markScraperAccountDead(
  accountId: string,
  status: DeadScraperAccountStatus,
): Promise<void> {
  const transition = await prisma.$transaction(async (tx) => {
    const existing = await tx.scraperProxyAccount.findUnique({
      where: { id: accountId },
      select: { status: true },
    });
    if (!existing) {
      return null;
    }

    await tx.scraperProxyAccount.update({
      where: { id: accountId },
      data: {
        status,
        cooldownUntil: null,
      },
    });

    return {
      previousStatus: existing.status,
      nextStatus: status,
    };
  });

  if (!transition) {
    return;
  }

  if (transition.previousStatus !== transition.nextStatus || !isDeadStatus(transition.previousStatus)) {
    await emitDeadAccountEvent(accountId, status);
  }
}

export async function handleScraperResponseFailure(args: {
  accountId: string | null;
  status: number;
  bodyPreview: string;
  context: string;
}): Promise<never> {
  const message = `${args.context} returned HTTP ${args.status}: ${args.bodyPreview}`;

  if (args.status === 429) {
    if (args.accountId) {
      await markScraperAccountRateLimited(args.accountId);
    }
    throw new RateLimitError(message, args.accountId, args.status);
  }

  if (args.status === 401) {
    if (args.accountId) {
      await markScraperAccountDead(args.accountId, LOCKED_STATUS);
    }
    throw new SessionDeadError(message, args.accountId, LOCKED_STATUS, args.status);
  }

  if (args.status === 403) {
    const nextStatus = classifyForbiddenAccountStatus(args.bodyPreview);
    if (args.accountId) {
      await markScraperAccountDead(args.accountId, nextStatus);
    }
    throw new SessionDeadError(message, args.accountId, nextStatus, args.status);
  }

  throw new Error(message);
}

export async function createSessionBroker(params: {
  statePath?: string;
  sessionFilePath?: string | null;
  maxRequestsPerHour?: number;
  minIntervalMs?: number;
  stateBackend?: string;
  databaseUrl?: string | null;
  stateSchema?: string;
  stateTable?: string;
  stateRowId?: string;
  proxyTable?: string;
} = {}) {
  const {
    statePath = DEFAULT_STATE_FILE,
    stateBackend = process.env.X_WEB_SCRAPE_STATE_BACKEND ?? DEFAULT_STATE_BACKEND,
    databaseUrl = process.env.DATABASE_URL ?? null,
    stateSchema = process.env.X_WEB_SCRAPE_STATE_SCHEMA ?? "public",
    stateTable = process.env.X_WEB_SCRAPE_STATE_TABLE ?? DEFAULT_STATE_TABLE,
    stateRowId = process.env.X_WEB_SCRAPE_STATE_ROW_ID ?? DEFAULT_STATE_ROW_ID,
  } = params;

  const stateStore = await createBrokerStateStore({
    statePath,
    stateBackend,
    databaseUrl,
    stateSchema,
    stateTable,
    stateRowId,
  });
  const state = await stateStore.read();

  async function persistState(): Promise<void> {
    await stateStore.write(state);
  }

  return {
    getCachedGlobal(key: string, ttlMs: number): string | null {
      return getCacheEntry(state.cache.global, key, ttlMs);
    },

    setCachedGlobal(key: string, value: string): void {
      setCacheEntry(state.cache.global, key, value);
    },

    getCachedUserId(account: string, ttlMs: number): string | null {
      return getCacheEntry(state.cache.userIds, account.toLowerCase(), ttlMs);
    },

    setCachedUserId(account: string, value: string): void {
      setCacheEntry(state.cache.userIds, account.toLowerCase(), value);
    },

    async acquire(options: {
      forcedSessionId?: string | null;
      forcedAccountId?: string | null;
      requireAccount?: boolean;
      fleet?: string;
    } = {}): Promise<ScraperSessionHandle> {
      const forcedAccountId =
        options.forcedAccountId?.trim() ||
        options.forcedSessionId?.trim() ||
        null;
      const requireAccount = options.requireAccount ?? true;

      try {
        const handle = await getHealthySession({ forcedAccountId });
        return handle;
      } catch (error) {
        if (requireAccount || !(error instanceof NoHealthySessionError)) {
          throw error;
        }

        return {
          kind: "default",
          label: "default",
          accountId: null,
          username: null,
          cookie: null,
          csrfToken: null,
          userAgent: null,
          bearerToken: null,
        };
      }
    },

    async markSuccess(_handle?: unknown): Promise<void> {
      await persistState();
    },

    async markFailure(_handle?: unknown): Promise<void> {
      await persistState();
    },

    async close(): Promise<void> {
      await stateStore.close();
    },
  };
}
