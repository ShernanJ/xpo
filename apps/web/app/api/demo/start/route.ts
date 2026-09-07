import { NextResponse } from "next/server";

import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { createDemoWorkspace } from "@/lib/demo/workspace";
import { capturePostHogServerEvent } from "@/lib/posthog/server";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import {
  buildErrorResponse,
  getRequestIp,
} from "@/lib/security/requestValidation";

function isDatabaseConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && "cause" in error
      ? String((error as Error & { cause?: unknown }).cause)
      : "";
  const combined = `${message} ${cause}`;
  return (
    /\bENOTFOUND\b/i.test(combined) ||
    /tenant\/user .* not found/i.test(combined) ||
    /database.*(unavailable|connect|connection)/i.test(combined)
  );
}

function buildDemoDatabaseUnavailableResponse() {
  return buildErrorResponse({
    status: 503,
    field: "database",
    message:
      "Demo mode needs a reachable PostgreSQL database so Xpo can persist the demo workspace. Check DATABASE_URL, run migrations, then retry Try Demo.",
    extras: {
      code: "DEMO_DATABASE_UNAVAILABLE",
    },
  });
}

function isSessionConfigurationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /SESSION_SECRET/i.test(message);
}

function buildDemoSessionUnavailableResponse() {
  return buildErrorResponse({
    status: 503,
    field: "session",
    message:
      "Demo mode needs SESSION_SECRET so Xpo can sign the demo session cookie. Set SESSION_SECRET, restart the dev server, then retry Try Demo.",
    extras: {
      code: "DEMO_SESSION_UNAVAILABLE",
    },
  });
}

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function GET(request: Request) {
  let rateLimit;
  try {
    rateLimit = await consumeRateLimit({
      key: `demo:start:ip:${getRequestIp(request)}`,
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("Demo start failed because the database is unavailable:", error);
      return buildDemoDatabaseUnavailableResponse();
    }

    throw error;
  }

  if (!rateLimit.ok) {
    return buildErrorResponse({
      status: 429,
      field: "rate",
      message: "Too many demo sessions started from this network. Please try again shortly.",
      extras: {
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
    });
  }

  let demo;
  try {
    demo = await createDemoWorkspace(request.headers.get("user-agent"));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("Demo workspace creation failed because the database is unavailable:", error);
      return buildDemoDatabaseUnavailableResponse();
    }

    throw error;
  }
  let sessionToken;
  try {
    sessionToken = await createSessionToken({
      userId: demo.userId,
      email: null,
    });
  } catch (error) {
    if (isSessionConfigurationError(error)) {
      console.error("Demo start failed because session signing is not configured:", error);
      return buildDemoSessionUnavailableResponse();
    }

    throw error;
  }

  const redirectUrl = new URL("/chat", request.url);
  redirectUrl.searchParams.set("xHandle", demo.xHandle);
  const response = NextResponse.redirect(redirectUrl);
  setSessionCookie(response, sessionToken);

  await capturePostHogServerEvent({
    request,
    distinctId: demo.userId,
    event: "xpo_demo_workspace_started",
    properties: {
      account: demo.xHandle,
      run_id: demo.runId,
      route: "/api/demo/start",
    },
  }).catch((error) =>
    console.error("Failed to capture demo workspace analytics event:", error),
  );

  return response;
}
