import type {
  OnboardingInput,
  XPinnedPost,
  XPublicPost,
  XPublicProfile,
} from "@/lib/onboarding/contracts/types";
import type { ExtensionOpportunityCandidate } from "@/lib/extension/types";
import type { SourceMaterialAssetInput } from "@/lib/agent-v2/grounding/sourceMaterials";

export const DEMO_CREATOR_HANDLE = "mayaops";

export const DEMO_ONBOARDING_INPUT: OnboardingInput = {
  account: DEMO_CREATOR_HANDLE,
  goal: "leads",
  timeBudgetMinutes: 45,
  postingCadenceCapacity: "1_per_day",
  replyBudgetPerDay: "5_15",
  tone: {
    casing: "normal",
    risk: "safe",
  },
  transformationMode: "optimize",
  transformationModeSource: "default",
  scrapeFreshness: "cache_only",
};

export const DEMO_PROFILE: XPublicProfile = {
  username: DEMO_CREATOR_HANDLE,
  name: "Maya Chen",
  bio:
    "Building ops tools for tiny AI teams. Notes on agent workflows, founder sales, and keeping launches boring enough to survive.",
  avatarUrl: null,
  headerImageUrl: null,
  isVerified: false,
  followersCount: 8420,
  followingCount: 610,
  statusesCount: 1384,
  createdAt: "2021-04-18T15:12:00.000Z",
};

export const DEMO_PINNED_POST: XPinnedPost = {
  id: "demo_mayaops_pinned",
  text:
    "Small AI teams do not need more dashboards.\n\nThey need one place where customer pain, product bets, and founder follow-up stop leaking between tools.\n\nThat is what I am building this year.",
  createdAt: "2026-06-18T16:04:00.000Z",
  metrics: {
    likeCount: 288,
    replyCount: 41,
    repostCount: 37,
    quoteCount: 12,
  },
  url: "https://x.com/mayaops/status/demo_mayaops_pinned",
  expandedUrls: [],
  imageUrls: [],
  linkSignal: "none",
};

const DEMO_POST_TEXTS = [
  "The best product specs I see from founders are usually customer emails with the panic removed.",
  "If your AI agent needs six setup screens before it does one useful thing, you built a settings page with a mascot.",
  "My current launch checklist:\n\n- one narrow promise\n- one proof screenshot\n- one objection handled\n- one follow-up path\n\nEverything else goes into the parking lot.",
  "Tiny teams win when the product remembers what the founder would otherwise have to remember manually.",
  "A surprisingly good growth loop: publish the operating constraint, not the victory lap.",
  "I trust a boring onboarding flow that finishes more than a magical one that needs a perfect API day.",
  "The useful version of founder-led sales is not charisma. It is fast memory.",
  "A customer saying \"we already do this in a spreadsheet\" is not a dismissal. It is a map.",
  "Agent UX rule I keep coming back to: ask only when the answer changes the next action.",
  "You can feel when a product team has never watched a customer recover from a failed import.",
  "The strongest demo data is not fake-good. It has wrinkles, constraints, and enough history to make the product think.",
  "One thing I like about small markets: distribution is less about shouting and more about being repeatedly useful in the same room.",
  "I am less interested in autonomous agents than accountable ones.",
  "If an AI workflow cannot explain what source it used, it is not ready to touch a customer's voice.",
  "Good internal tools feel like someone removed three tabs from your browser.",
  "The fastest path to trust is showing what the system will not claim.",
  "Founder content gets better when it moves from lesson-posting to receipt-posting.",
  "A product strategy that requires perfect weekly discipline is usually a calendar fantasy.",
  "The next wave of AI tools will be judged less by model quality and more by recovery quality.",
  "Today I deleted a feature because the empty state was doing a better job.",
  "A useful CRM for founders should remember:\n\n- why now\n- why us\n- what changed\n- what to send next",
  "The reason teams keep screenshots in Slack is not laziness. Screenshots preserve context that tools keep flattening.",
  "I want software that makes the honest path the shortest path.",
  "Every startup has a hidden onboarding tax. You find it by counting the tabs open during setup.",
  "AI copilots should earn trust in small loops before asking for broad permissions.",
  "A reply can be more valuable than a post when it proves you understood the room.",
  "The best launch posts answer one question: what painful thing changed because this exists?",
  "I keep a graveyard doc for clever product ideas that would make support worse.",
  "If your product has a source-of-truth problem, the AI feature will inherit it at model speed.",
  "A good workflow gives users a place to put uncertainty without pretending it is resolved.",
  "The underrated founder skill is making private customer language legible without making it generic.",
  "One useful test for agent features: can the user interrupt, correct, and continue without starting over?",
  "I would rather have five customers use one loop every week than fifty users admire a dashboard once.",
  "The best positioning notes come from sales calls where the buyer corrects your category.",
  "Do not ship an AI writing tool that cannot distinguish source material from vibes.",
  "The highest-leverage product work this week was naming the failure states clearly.",
  "A product can be impressive and still be too fragile to demo.",
  "I like launches that teach the user how to judge the product.",
  "When a workflow works, users describe the outcome. When it does not, they describe the interface.",
  "The simplest retention strategy is still: remember what the user already told you.",
  "An agent that cites the wrong context is worse than an agent that asks a short follow-up.",
  "A lot of product polish is just removing suspense from normal operations.",
  "The best reply opportunities are posts where you can add a concrete example, not applause.",
  "I am building for founders who need sharper follow-up, not another blank AI prompt.",
  "The content moat for tiny teams is operational honesty.",
  "Every reliable demo has the same promise: the interesting part will work even if the internet has a weird day.",
];

function buildDemoPost(index: number, text: string): XPublicPost {
  const createdAt = new Date(Date.UTC(2026, 6, 1 + index, 14 + (index % 8), 9 + (index % 37)));
  const engagementBase = 28 + ((index * 17) % 84);
  return {
    id: `demo_mayaops_${String(index + 1).padStart(2, "0")}`,
    text,
    createdAt: createdAt.toISOString(),
    metrics: {
      likeCount: engagementBase + (index % 5) * 11,
      replyCount: 4 + ((index * 3) % 18),
      repostCount: 3 + ((index * 5) % 24),
      quoteCount: index % 6,
    },
    expandedUrls: index === 20 ? ["https://mayaops.example/checklist"] : [],
    imageUrls: [],
    linkSignal: index === 20 ? "external" : "none",
  };
}

export const DEMO_RECENT_POSTS: XPublicPost[] = DEMO_POST_TEXTS.map((text, index) =>
  buildDemoPost(index, text),
);

export const DEMO_RECENT_REPLY_POSTS: XPublicPost[] = [
  {
    id: "demo_mayaops_reply_01",
    text:
      "This is the exact point. The product should make the next honest step obvious instead of making the user perform confidence.",
    createdAt: "2026-08-12T15:34:00.000Z",
    metrics: { likeCount: 72, replyCount: 6, repostCount: 8, quoteCount: 1 },
  },
  {
    id: "demo_mayaops_reply_02",
    text:
      "I would start by logging the failed handoff. Most teams try to automate the step before they know where context disappears.",
    createdAt: "2026-08-18T18:11:00.000Z",
    metrics: { likeCount: 64, replyCount: 5, repostCount: 7, quoteCount: 0 },
  },
  {
    id: "demo_mayaops_reply_03",
    text:
      "The nuance is that a spreadsheet can be the spec. The product has to respect why the spreadsheet survived.",
    createdAt: "2026-08-24T13:47:00.000Z",
    metrics: { likeCount: 91, replyCount: 9, repostCount: 12, quoteCount: 2 },
  },
];

export const DEMO_SOURCE_MATERIALS: SourceMaterialAssetInput[] = [
  {
    type: "story",
    title: "Three-tab onboarding audit",
    tags: ["onboarding", "customer-research", "ops"],
    verified: true,
    claims: [
      "Maya watched five founders onboard into an AI sales tool and every one kept a separate notes tab open.",
      "The most common failure was losing customer-specific context between import, draft, and follow-up steps.",
    ],
    snippets: [
      "Count the tabs open during setup. That is where the real onboarding tax hides.",
    ],
    doNotClaim: ["Do not claim this was a statistically significant study."],
  },
  {
    type: "framework",
    title: "Reliable AI workflow test",
    tags: ["agents", "reliability", "product"],
    verified: true,
    claims: [
      "A useful agent workflow should let the user interrupt, correct, and continue without restarting.",
      "The system should reveal which source material shaped a generated draft.",
    ],
    snippets: [
      "Ask only when the answer changes the next action.",
      "Show what the system will not claim.",
    ],
    doNotClaim: ["Do not imply the workflow is fully autonomous."],
  },
  {
    type: "case_study",
    title: "Founder follow-up memory loop",
    tags: ["founder-sales", "crm", "follow-up"],
    verified: true,
    claims: [
      "Maya's prototype organizes follow-up around why now, why us, what changed, and what to send next.",
      "The target user is a tiny AI team where the founder still owns sales and customer learning.",
    ],
    snippets: [
      "Founder-led sales is not charisma. It is fast memory.",
    ],
    doNotClaim: ["Do not name real customers or revenue figures."],
  },
];

export const DEMO_REPLY_CANDIDATES: ExtensionOpportunityCandidate[] = [
  {
    postId: "demo_reply_source_01",
    author: {
      id: "demo_author_01",
      handle: "nora_builds",
      name: "Nora Patel",
      verified: false,
      followerCount: 18300,
    },
    text:
      "Most AI products demo well until the first import fails. The recovery path tells you more about the team than the happy path.",
    url: "https://x.com/nora_builds/status/demo_reply_source_01",
    createdAtIso: "2026-08-30T15:04:00.000Z",
    engagement: {
      replyCount: 18,
      repostCount: 74,
      likeCount: 410,
      quoteCount: 23,
      viewCount: 38000,
    },
    postType: "original",
    conversation: {
      conversationId: "demo_reply_source_01",
      inReplyToPostId: null,
      inReplyToHandle: null,
    },
    media: {
      hasMedia: false,
      hasImage: false,
      hasVideo: false,
      hasGif: false,
      hasLink: false,
      hasPoll: false,
    },
    surface: "home",
    captureSource: "dom",
    capturedAtIso: "2026-08-30T15:42:00.000Z",
  },
  {
    postId: "demo_reply_source_02",
    author: {
      id: "demo_author_02",
      handle: "samir_ops",
      name: "Samir Rao",
      verified: false,
      followerCount: 9200,
    },
    text:
      "The best CRM for an early startup might just be a system that remembers the exact customer wording before the founder turns it into mush.",
    url: "https://x.com/samir_ops/status/demo_reply_source_02",
    createdAtIso: "2026-08-29T18:22:00.000Z",
    engagement: {
      replyCount: 11,
      repostCount: 39,
      likeCount: 266,
      quoteCount: 9,
      viewCount: 21000,
    },
    postType: "original",
    conversation: {
      conversationId: "demo_reply_source_02",
      inReplyToPostId: null,
      inReplyToHandle: null,
    },
    media: {
      hasMedia: false,
      hasImage: false,
      hasVideo: false,
      hasGif: false,
      hasLink: false,
      hasPoll: false,
    },
    surface: "search",
    captureSource: "dom",
    capturedAtIso: "2026-08-29T19:00:00.000Z",
  },
  {
    postId: "demo_reply_source_03",
    author: {
      id: "demo_author_03",
      handle: "lena_agents",
      name: "Lena Ortiz",
      verified: true,
      followerCount: 64000,
    },
    text:
      "Agent builders should publish more failure states. It is much easier to trust a tool when you know what happens after it gets confused.",
    url: "https://x.com/lena_agents/status/demo_reply_source_03",
    createdAtIso: "2026-08-31T12:10:00.000Z",
    engagement: {
      replyCount: 31,
      repostCount: 118,
      likeCount: 780,
      quoteCount: 44,
      viewCount: 86000,
    },
    postType: "original",
    conversation: {
      conversationId: "demo_reply_source_03",
      inReplyToPostId: null,
      inReplyToHandle: null,
    },
    media: {
      hasMedia: false,
      hasImage: false,
      hasVideo: false,
      hasGif: false,
      hasLink: false,
      hasPoll: false,
    },
    surface: "home",
    captureSource: "dom",
    capturedAtIso: "2026-08-31T12:45:00.000Z",
  },
];
