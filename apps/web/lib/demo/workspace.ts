import { randomUUID } from "crypto";

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { OnboardingResult, XPublicPost } from "@/lib/onboarding/contracts/types";
import { finalizeOnboardingRunForUser } from "@/lib/onboarding/pipeline/finalizeRun";
import { buildOnboardingResultFromDataSource } from "@/lib/onboarding/pipeline/service";
import { buildDemoDataSource } from "@/lib/onboarding/sources/demoSource";
import { buildCreatorAgentContext } from "@/lib/onboarding/strategy/agentContext";
import {
  persistRankedOpportunity,
  rankOpportunityBatch,
} from "@/lib/extension/opportunityBatch";
import {
  DEMO_CREATOR_HANDLE,
  DEMO_ONBOARDING_INPUT,
  DEMO_REPLY_CANDIDATES,
  DEMO_SOURCE_MATERIALS,
} from "./fixture";
import {
  DEMO_USER_ID_PREFIX,
  DEMO_USER_NAME,
} from "./identity";

const DEMO_RETENTION_HOURS = 48;
const DEMO_CREDIT_LIMIT = 40;

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getDemoUserId(): string {
  return `${DEMO_USER_ID_PREFIX}${randomUUID()}`;
}

function namespaceDemoPostId(post: XPublicPost, suffix: string): XPublicPost {
  return {
    ...post,
    id: `${post.id}_${suffix}`,
  };
}

function namespaceDemoOnboardingResult(
  result: OnboardingResult,
  userId: string,
): OnboardingResult {
  const suffix = userId.replace(/^demo_/, "").slice(0, 8);
  return {
    ...result,
    pinnedPost: result.pinnedPost
      ? {
          ...result.pinnedPost,
          id: `${result.pinnedPost.id}_${suffix}`,
        }
      : null,
    recentPosts: result.recentPosts.map((post) => namespaceDemoPostId(post, suffix)),
    recentReplyPosts: result.recentReplyPosts.map((post) =>
      namespaceDemoPostId(post, suffix),
    ),
    recentQuotePosts: result.recentQuotePosts.map((post) =>
      namespaceDemoPostId(post, suffix),
    ),
  };
}

async function pruneExpiredDemoUsers() {
  const cutoff = new Date(Date.now() - DEMO_RETENTION_HOURS * 60 * 60 * 1000);
  await prisma.user.deleteMany({
    where: {
      id: {
        startsWith: DEMO_USER_ID_PREFIX,
      },
      createdAt: {
        lt: cutoff,
      },
    },
  });
}

async function seedDemoSourceMaterials(args: {
  userId: string;
  xHandle: string;
}) {
  await prisma.sourceMaterialAsset.createMany({
    data: DEMO_SOURCE_MATERIALS.map((asset) => ({
      userId: args.userId,
      xHandle: args.xHandle,
      type: asset.type,
      title: asset.title,
      tags: asset.tags as unknown as Prisma.InputJsonValue,
      verified: asset.verified,
      claims: asset.claims as unknown as Prisma.InputJsonValue,
      snippets: asset.snippets as unknown as Prisma.InputJsonValue,
      doNotClaim: asset.doNotClaim as unknown as Prisma.InputJsonValue,
    })),
  });
}

async function seedDemoReplyOpportunities(args: {
  userId: string;
  xHandle: string;
  result: ReturnType<typeof buildOnboardingResultFromDataSource>;
}) {
  const context = buildCreatorAgentContext({
    runId: `or_${args.userId}`,
    onboarding: args.result,
  });
  const ranked = rankOpportunityBatch({
    request: {
      pageUrl: "https://x.com/home",
      surface: "home",
      candidates: DEMO_REPLY_CANDIDATES,
    },
    strategy: context.growthStrategySnapshot,
    styleCard: null,
  });

  for (const opportunity of ranked.topRanked) {
    await persistRankedOpportunity({
      userId: args.userId,
      xHandle: args.xHandle,
      growthStage: args.result.growthStage,
      goal: args.result.strategyState.goal,
      tone: "builder",
      ranked: opportunity,
    });
  }
}

export async function createDemoWorkspace(userAgent: string | null) {
  await pruneExpiredDemoUsers().catch((error) =>
    console.error("Failed to prune expired demo users:", error),
  );

  const userId = getDemoUserId();
  const xHandle = DEMO_CREATOR_HANDLE;
  const input = {
    ...DEMO_ONBOARDING_INPUT,
    account: xHandle,
  };
  const result = namespaceDemoOnboardingResult(
    buildOnboardingResultFromDataSource({
      input,
      dataSource: buildDemoDataSource(),
    }),
    userId,
  );

  await prisma.user.create({
    data: {
      id: userId,
      name: DEMO_USER_NAME,
      activeXHandle: xHandle,
    },
  });

  const finalized = await finalizeOnboardingRunForUser({
    input,
    result,
    backgroundSync: {
      queued: false,
      jobId: null,
      deduped: false,
    },
    runId: `or_${userId}`,
    suppressLegacyBackfill: true,
    userAgent,
    userId,
  });

  await prisma.billingEntitlement.create({
    data: {
      userId,
      plan: "free",
      status: "active",
      billingCycle: "monthly",
      creditsRemaining: DEMO_CREDIT_LIMIT,
      creditLimit: DEMO_CREDIT_LIMIT,
      creditCycleResetsAt: addDays(new Date(), 1),
      showFirstPricingModal: false,
    },
  });

  await Promise.all([
    seedDemoSourceMaterials({
      userId,
      xHandle,
    }),
    seedDemoReplyOpportunities({
      userId,
      xHandle,
      result,
    }),
  ]);

  return {
    userId,
    xHandle,
    runId: finalized.payload.runId,
  };
}
