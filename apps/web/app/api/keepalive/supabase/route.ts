import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPresentedSecret(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) {
    return bearerMatch[1].trim();
  }

  const headerSecret = request.headers.get("x-keepalive-secret")?.trim();
  if (headerSecret) {
    return headerSecret;
  }

  const url = new URL(request.url);
  return url.searchParams.get("token")?.trim() || null;
}

function secretsMatch(actual: string | null, expected: string | undefined): boolean {
  const normalizedExpected = expected?.trim();
  if (!actual || !normalizedExpected) {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(normalizedExpected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

async function handleKeepalive(request: Request) {
  const expectedSecret = process.env.SUPABASE_KEEPALIVE_SECRET;
  if (!expectedSecret?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        code: "KEEPALIVE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  if (!secretsMatch(getPresentedSecret(request), expectedSecret)) {
    return NextResponse.json(
      {
        ok: false,
        code: "KEEPALIVE_UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

  const startedAt = Date.now();
  await prisma.$queryRaw`select 1`;

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  });
}

export async function GET(request: Request) {
  return handleKeepalive(request);
}

export async function POST(request: Request) {
  return handleKeepalive(request);
}
