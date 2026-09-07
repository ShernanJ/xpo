import {
  DEMO_PINNED_POST,
  DEMO_PROFILE,
  DEMO_RECENT_POSTS,
  DEMO_RECENT_REPLY_POSTS,
} from "@/lib/demo/fixture";
import type { OnboardingDataSource } from "./types";

export function buildDemoDataSource(): OnboardingDataSource {
  return {
    source: "demo",
    profile: DEMO_PROFILE,
    pinnedPost: DEMO_PINNED_POST,
    posts: DEMO_RECENT_POSTS,
    replyPosts: DEMO_RECENT_REPLY_POSTS,
    quotePosts: [],
    capturedPostCount: DEMO_RECENT_POSTS.length,
    capturedReplyPostCount: DEMO_RECENT_REPLY_POSTS.length,
    capturedQuotePostCount: 0,
    warnings: [
      "Portfolio demo mode uses a stable account snapshot for X ingestion. Product workflows still run against persisted workspace data.",
    ],
    syncState: {
      routeClass: "lightweight",
      statusesCount: DEMO_PROFILE.statusesCount ?? null,
      createdYear: 2021,
      searchYearFloor: 2021,
      phase: "complete",
      repliesExcluded: false,
    },
  };
}
