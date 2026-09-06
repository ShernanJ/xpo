# Xpo

AI growth tool for X with account analysis, voice-aware drafting, reply discovery, and a companion browser extension.

<img width="1245" height="767" alt="Xpo" src="https://github.com/user-attachments/assets/7691ef46-3907-40d2-83d6-868586062ac7" />

[Portfolio Case Study](https://shernanjavier.com/work/xpo) · [Build-in-public post](https://www.linkedin.com/posts/shernanjavier_buildinpublic-hiringinpublic-stan-ugcPost-7446465824376348672-dj54)

## The idea

Most AI writing tools can generate posts, but they usually don't understand the person they're writing for.

Xpo is built around learning a creator's account, source material, previous content, and positioning so it can help with strategy, drafting, replies, and engagement without flattening everything into the same generic AI voice.

## What it does

- Analyzes an X account and builds an initial creator strategy
- Grounds AI outputs in source material, previous posts, and account positioning
- Supports ideation, drafting, revision, replies, and post analysis
- Finds and ranks good reply opportunities
- Generates context-aware replies through a companion browser extension
- Includes authentication, billing, entitlements, and persistent creator workspaces

## How it works

```text
X account + source material
          ↓
   creator profile
          ↓
 strategy + voice context
          ↓
      AI workspace
     ↙            ↘
drafting        replies
                  ↓
         browser extension
````

## Technical highlights

* Built a structured AI runtime for planning, drafting, revision, reply generation, and post analysis
* Grounded outputs in creator-provided facts, stories, playbooks, and previous content
* Designed persistent chat threads, memories, source materials, onboarding runs, and product events
* Built APIs for browser-extension authentication, opportunity ranking, and reply generation
* Added Stripe checkout, billing state, webhooks, and entitlement controls
* Implemented multiple onboarding data-source paths with production-safe fallback behavior

## Stack

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind CSS 4` · `PostgreSQL` · `Prisma` · `Supabase` · `Groq` · `Stripe`

## Companion extension

The browser extension adds Xpo directly to the browsing workflow.

It can inspect visible X posts, evaluate which conversations are worth joining, and request reply drafts using the creator's existing voice and account context.

The extension communicates with the main Xpo application through authenticated APIs for:

* opportunity ranking
* reply options
* reply generation
* extension sessions
* interaction logging

## Architecture

The shipped application currently runs as a single Next.js deployment in `apps/web`.

```text
Browser
   ↓
Next.js UI + API routes
   ↓
Domain logic
├── AI runtime
├── onboarding
├── creator memory
├── billing
└── extension workflows
   ↓
Prisma
   ↓
PostgreSQL
```

External services provide authentication, model inference, billing, and X data access.

For a deeper technical breakdown:

* [`docs/app-architecture.md`](docs/app-architecture.md)
* [`docs/app-diagrams.md`](docs/app-diagrams.md)

## Project origin

The original Stanley for X prototype came from seeing Stan experiment publicly with hiring engineers through build-in-public challenges.

So I made something instead of sending another application.

<a href="https://www.linkedin.com/posts/shernanjavier_buildinpublic-hiringinpublic-stan-ugcPost-7446465824376348672-dj54">
  <img width="365" height="395" alt="Stanley for X LinkedIn post" src="https://github.com/user-attachments/assets/398619d4-1cc9-4b72-ac27-d8fd1a494e6d" />
</a>

That prototype eventually became Xpo.

<details>
<summary><strong>Repo structure</strong></summary>

The active application lives in `apps/web`.

```text
.
├── README.md
├── PLAN.md
├── Artifact.md
├── LIVE_AGENT.md
├── apps/
│   └── web/
│       ├── app/              # App Router pages and API routes
│       ├── components/       # Shared UI and providers
│       ├── lib/              # AI, onboarding, billing, auth, extension logic
│       ├── prisma/           # Schema and migrations
│       ├── public/
│       ├── scripts/
│       ├── package.json
│       └── .env.example
└── docs/
    ├── app-architecture.md
    └── app-diagrams.md
```

The top-level `apps/api`, `packages/*`, `workers/*`, and `infra/` directories are placeholders from an earlier architecture plan and are not part of the shipped runtime.

</details>

<details>
<summary><strong>Run locally</strong></summary>

```bash
cd apps/web
pnpm install
cp .env.example .env
pnpm dev
```

Minimum environment variables:

```text
DATABASE_URL
DATABASE_MIGRATION_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SESSION_SECRET
GROQ_API_KEY
```

Useful commands:

```bash
pnpm build
pnpm lint
pnpm test:ui
pnpm test:e2e
pnpm test:v2
pnpm test:extension
```

</details>

<details>
<summary><strong>Implementation notes</strong></summary>

* Primary persistence is Prisma on PostgreSQL
* Authentication uses Supabase identity with a custom application session
* The current LLM gateway uses the Groq SDK
* Stripe handles checkout, portal access, webhooks, and entitlement state
* `ONBOARDING_MODE` supports scrape, X API, mock, and automatic fallback paths
* Production mock fallback is guarded explicitly
* Legacy NextAuth code remains in the repository but is not the primary authentication path

The older files below describe architecture direction and migration work rather than the exact shipped runtime:

* [`PLAN.md`](PLAN.md)
* [`Artifact.md`](Artifact.md)
* [`LIVE_AGENT.md`](LIVE_AGENT.md)

</details>
