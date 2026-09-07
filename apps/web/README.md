This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Production Deploy Notes

`pnpm build` only compiles the app and generates the Prisma client. It does not prove that the target database already has the latest Prisma tables and indexes.

Before sending production traffic to this app, run:

```bash
pnpm -C apps/web run deploy:prepare
pnpm -C apps/web build
```

`pnpm -C apps/web run deploy:prepare` is the deploy-stage command that applies Prisma migrations and verifies required tables before traffic. Keep that step in CI/CD even if your runtime never calls `next start`.

If you start the app with `pnpm -C apps/web start`, the `prestart` hook still runs the same DB readiness checks as a last line of defense. That should not be the only production control on serverless platforms.

## Portfolio Demo Mode

The landing page **Try Demo** CTA opens `/api/demo/start`. That route creates a disposable demo user, persists the built-in `mayaops` creator snapshot, seeds source materials and reply opportunities, signs the normal `sx_session` cookie, and redirects to the chat workspace.

Demo mode keeps the product architecture honest: the workspace still uses Prisma persistence, creator context, credits, and the real AI drafting/reply flows. It only replaces live X ingestion with stable fixture data. Demo users cannot open Stripe checkout or the billing portal.

Local demo prerequisites:

```bash
cd apps/web
cp .env.example .env
# Set DATABASE_URL, DATABASE_MIGRATION_URL, SESSION_SECRET, GROQ_API_KEY, and OPENAI_API_KEY.
pnpm run deploy:prepare
pnpm dev
```

If **Try Demo** returns `DEMO_DATABASE_UNAVAILABLE`, the app cannot reach the configured PostgreSQL database. Supabase pooler errors such as `tenant/user ... not found` usually mean `DATABASE_URL` or `DATABASE_MIGRATION_URL` points at a stale or wrong Supabase project/user. Update the URL, apply migrations, restart the dev server, then retry.

Set `ONBOARDING_MODE=demo` only when you want the normal onboarding form to use the same portfolio fixture. Leave it as `auto` for production-like source resolution.

## Supabase Free Keepalive

Supabase Free projects can pause after low database activity. Xpo includes a protected keepalive route that performs a tiny `select 1` query:

```text
GET /api/keepalive/supabase
POST /api/keepalive/supabase
```

Set `SUPABASE_KEEPALIVE_SECRET`, then schedule an external cron to call the deployed route a few times per day:

```bash
curl -fsS \
  -H "Authorization: Bearer $SUPABASE_KEEPALIVE_SECRET" \
  https://your-domain.com/api/keepalive/supabase
```

Simple uptime services that cannot send headers can call:

```text
https://your-domain.com/api/keepalive/supabase?token=YOUR_SECRET
```

Do not schedule `/api/demo/start` as the heartbeat; that creates demo users and seeded workspaces. If the project is already paused, resume it in the Supabase Dashboard first. Upgrading the Supabase organization to Pro is the only official way to guarantee projects will not pause for inactivity.

## Background Worker

Run `pnpm -C apps/web run worker:background` anywhere you need durable background processing. The worker now handles both onboarding backfill jobs and chat-turn lease recovery for interrupted creator chat requests.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
