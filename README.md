# Xpo

**AI growth copilot for creators on X.**
Xpo helps you go from random posting to a repeatable system: **analyze → plan → draft → refine → post**.

> The companion extension is a *secondary* layer that helps you move faster inside the X feed (reply opportunities + reply drafting).

![Xpo Hero](./assets/hero.png)

<p align="center">
  <a href="#demo">Demo</a> •
  <a href="#what-xpo-does">What it does</a> •
  <a href="#the-companion-extension">Extension</a> •
  <a href="#how-it-works">How it works</a> •
  <a href="#product-principles">Principles</a> •
  <a href="#stack">Stack</a> •
  <a href="#status--access">Status</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-active-success" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-blue" />
  <img alt="Repo" src="https://img.shields.io/badge/repo-public%20overview-6b7280" />
</p>

---

## Demo

![Xpo Demo](./assets/demo.gif)

**What you’re seeing**

* Handle-based onboarding from X
* Instant profile + performance modeling
* Guided workflow (idea → plan → draft → revise)
* Draft output formatted for X constraints

---

## Why Xpo

Most AI writing tools generate content.

**Xpo builds a growth workflow** around *your* posting history, voice, and constraints — so you can improve outcomes, not just output.

### MVP thesis

Xpo is built around **growth stages** — because what works at **0 → 1k** is different from **1k → 10k**, **10k → 50k**, and beyond.

The MVP focuses on two things:

1. **Stage-aware guidance**
   Xpo detects your current stage (based on account + post signals) and adapts recommendations, formats, and feedback loops accordingly.

2. **A repeatable execution loop**
   No matter the stage, the workflow stays consistent: **analyze → plan → draft → refine → post**.

**Reply-heavy playbooks matter most in early growth** (especially **0 → 1k**), but Xpo supports multiple stages with different strategy weights — and the companion extension helps you execute in-feed when needed.

---

## 🚀 Growth playbooks by stage

Xpo doesn’t give one-size-fits-all advice. It adapts the playbook based on where you are — and what’s most likely to move the needle **right now**.

### 🧭 Stage overview (at a glance)

| Stage         | Primary lever              | Win condition                                        | Xpo will bias toward                            |
| ------------- | -------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| **0 → 1k**    | Distribution + proof       | You get discovered repeatedly + your lane is obvious | Replies + standalone posts + series consistency |
| **1k → 10k**  | Retention + positioning    | People remember you + share you                      | Pillars + stronger hooks + compounding sequels  |
| **10k → 50k** | Depth + leverage           | Your ideas travel without you                        | Signature takes + content atoms + collabs       |
| **50k+**      | Productization + ecosystem | Audience becomes an engine (inbound + revenue)       | Offers + community loops + owned distribution   |

---

### 🌱 0 → 1k: Distribution + proof of competence

**Primary lever:** consistent output + reply-based distribution
**Win condition:** people discover you repeatedly and know what you stand for.

**High‑ROI moves ✅**

* 🎯 **Pick 1–2 lanes** (topic + audience) and repeat them until your feed is predictable.
* 💬 **Reply-to-distribution**: spend time in threads where your ideal followers already are.
* 🧱 **Standalone posts**: every post must make sense with *no* prior context.
* 🔁 **Series**: build a repeating format people recognize.

**Examples 💡**

* 💬 **Reply template (value-first):** “here’s the missing step most people skip → …”
* 🔁 **Series idea:** “1 lesson from building X every day (Day 1/30)”
* 📅 **Weekly cadence:** 3 standalone posts + 30–60 targeted replies + 1 mini-thread.

---

### 🧩 1k → 10k: Retention + positioning

**Primary lever:** clear positioning + repeatable content pillars
**Win condition:** followers stay, share, and remember you.

**High‑ROI moves ✅**

* 🏛️ **Pillars → formats:** 3 pillars × 2 formats each (e.g., mini-thread + checklist).
* 🪝 **Stronger hooks:** open with the takeaway, not the backstory.
* 📈 **Compounding posts:** build on prior posts (sequels, updates, “part 2”).
* 🎯 **Selective replies:** fewer, higher quality; aim for “top 3 comment” placement.

**Examples 💡**

* 🏛️ **Pillar:** “growth systems” → **formats:** teardown / checklist
* ✍️ **Post upgrade:** “I shipped X” → “here’s the exact system that let me ship X in 48h”

---

### 🧠 10k → 50k: Depth + leverage

**Primary lever:** higher signal density + distribution loops that scale
**Win condition:** your ideas propagate without you always being online.

**High‑ROI moves ✅**

* 🧠 **Signature takes:** a repeatable POV that people quote.
* 📚 **Narrative arcs:** case studies, before/after, lessons over time.
* 🤝 **Collabs:** co-posts, interviews, cross-audience threads.
* ⚛️ **Content atoms:** 1 deep idea → 10 derivatives (replies, posts, threads).

**Examples 💡**

* ⚛️ Turn a teardown into: 1 thread + 3 standalone posts + 5 replies in relevant threads.
* 📌 “Playbook drop”: publish a framework people bookmark and reference.

---

### 🏗️ 50k+: Productization + ecosystem

**Primary lever:** scalable systems + community + products
**Win condition:** your audience turns into an engine (referrals, inbound, revenue).

**High‑ROI moves ✅**

* 🛍️ **Audience → offer alignment:** your content should pre-sell your product.
* 🧑‍🤝‍🧑 **Community loops:** challenges, prompts, templates, AMAs.
* 🧵 **Operator distribution:** newsletters, repurposing, owned channels.

**Examples 💡**

* 🧰 “Template tweet” → drive to a free resource → capture email → nurture.
* 🏁 “Challenge week” → daily prompts → recap thread → landing page.

> 🎯 Xpo’s job is to pick the **highest‑ROI next action** for your stage, then help you execute it (post drafting + optional in-feed reply support via the companion extension).

### 🧪 Example posts (what “works” at each stage)

> These are **original examples** (not pulled from real accounts). They’re here to show *shape + tone*.

#### 🌱 0 → 1k (standalone + replies)

* **Standalone (proof):**

  * “i built a tiny script that turns 30 mins of scrolling into 5 post ideas.

    the trick: steal *structures*, not content.

    want the template?”
* **Standalone (tactical):**

  * “your hook is probably too polite.

    try: ‘most people think X.
    but the real constraint is Y.’

    instant clarity.”
* **Reply (value-first):**

  * “this is the right idea — missing piece is distribution.

    ship the smallest version, then iterate with feedback.

    polish comes *after* signal.”

#### 🧩 1k → 10k (positioning + compounding)

* **Positioning:**

  * “i help builders turn messy growth into a weekly system.

    if you’re stuck at 300 followers, stop ‘posting more’.

    start ‘repeating what works.’”
* **Sequel post:**

  * “part 2: the 3 content pillars i use to never run out of posts

    1. build logs
    2. teardown lessons
    3. contrarian takes

    pick 2, repeat for 30 days.”
* **Checklist:**

  * “before you tweet:

    ✅ 1 clear takeaway
    ✅ 1 reason to care
    ✅ 1 next step

    everything else is optional.”

#### 🧠 10k → 50k (signature takes + leverage)

* **Signature take:**

  * “the best growth hack is taste.

    distribution amplifies *signal*.
    it can’t fix noise.”
* **Case study:**

  * “i rewrote the same idea 12 times.

    version 1 got 3 likes.
    version 12 got 40k views.

    the idea didn’t change.
    the *shape* did.”
* **Content atom:**

  * “1 framework i use for every post:

    claim → constraint → example → takeaway.

    repeat forever.”

#### 🏗️ 50k+ (ecosystem + productization)

* **Offer-aligned:**

  * “i’m publishing my ‘reply ROI’ playbook.

    it’s the exact system i use to pick *which* threads are worth my time.

    dropping a free page below.”
* **Community loop:**

  * “challenge: 7 days of ‘1 lesson / day’.

    i’ll reply to every post with a tighter hook.

    who’s in?”
* **Template post:**

  * “steal this:

    ‘most people do X.
    i do Y because __.
    here’s the tradeoff: __.’

    post it with your niche.”

---

## 🗣️ X culture + tone (not LinkedIn-coded)

X isn’t “professional writing.” It’s **fast, opinionated, and allergic to fluff**. The same idea can land completely differently depending on tone.

### What usually fails on X 🚫

* “in today’s world…” intros
* corporate positivity + buzzwords
* long preambles before the point
* formal CTA paragraphs (“I’d love your thoughts below”)

### What usually wins on X ✅

* **takeaway first** (then context)
* **specificity** (numbers, constraints, tradeoffs)
* **compressed language** (short lines, hard stops)
* **mild edge** (a clean opinion, not aggression)
* **builder vibes** (what you did, learned, shipped)

### Tone sliders Xpo supports

* 🧊 **Dry / minimal**: short, sharp, no emojis
* 😈 **Bold / spicy**: stronger claims + contrarian framing
* 🛠️ **Builder**: shipped lessons, constraints, tradeoffs
* 🤝 **Warm**: still concise, less edge

### Same idea: LinkedIn vs X (example)

**LinkedIn-coded:**

* “I’m excited to share a lesson I learned while building a new feature. One key takeaway was the importance of focusing on user needs and iterating quickly.”

**X-coded:**

* “shipped a feature in 48h.

  the lesson: speed isn’t chaos.
  it’s constraint.

  ship small → learn fast → scale after signal.”

## What Xpo does

### Core platform

#### 1) Fast account onboarding

Enter an X handle and Xpo maps profile signals, recent activity, and baseline performance.

![Onboarding](./assets/onboarding.png)

#### 2) Creator performance model

Xpo detects what currently works for your account:

* Strongest / weakest formats
* Hook patterns & opening lines that win
* Length range that tends to perform best
* Actionable “what to post next” recommendations

![Profile Analysis](./assets/profile-analysis.png)

#### 3) Multi-agent writing workflow

Inside chat, Xpo supports a full loop:

* Ideation
* Planning
* Draft generation
* Critique + revision
* Final formatting for X

![Workspace](./assets/workspace.png)

#### 4) Monetization + usage controls

Built-in billing flows with plan gating and Stripe checkout.

![Pricing](./assets/pricing.png)

---

## Companion extension (optional, but powerful)

Xpo also ships with a **companion browser extension** — designed for on-the-go execution inside X when you don’t want to context-switch back to the main app.

### What the extension is for

* **Reply opportunity scoring**: identify *which* posts are worth replying to (highest ROI)
* **Context-aware reply drafting**: draft replies that match the thread, your voice, and your goals
* **Fast iteration**: generate options (safe / bold), then tighten for clarity and tone
* **Feedback loop**: track what you replied to and how it performed to improve future suggestions

> The goal: make the **reply-heavy 1 → 1,000 playbook** feel like a repeatable system instead of guesswork.

**Suggested visuals**

* `./assets/extension-opportunity.png` — opportunity score UI
* `./assets/extension-reply-draft.png` — reply assistant UI

---

## Who it’s for

* **Creators** who want consistency without sounding like “AI content.”
* **Builders/operators** who want a system that compounds (not one-off prompts).
* Anyone stuck in **random posting** who wants a **repeatable loop**.

---

## How it works

### Platform loop

1. **Ingest**
   Pull account + post data from X inputs.

2. **Model**
   Compute baseline performance and extract repeatable patterns (formats, hooks, length band, engagement deltas).

3. **Orchestrate**
   Route requests through intent-aware flows (coach / ideate / plan / draft / revise).

4. **Refine**
   Enforce draft quality rules: voice fit, clarity, and X format constraints.

### Extension loop

1. **Detect**
   Identify potential reply opportunities in your feed.

2. **Score**
   Estimate ROI using signals like relevance, velocity, author size/fit, and your growth stage.

3. **Draft**
   Generate reply options tuned to thread context + your voice.

4. **Learn**
   Log the outcome to improve future recommendations.

---

## What users get

* Baseline engagement summary
* Strength/weakness breakdown
* Recommended content direction
* Draft(s) with a revision path
* Ready-to-post output (X-safe length + formatting)
* **Reply targets + suggested replies** (via the extension)

---

## Product principles

* **Signals before style**: deterministic analysis before generation.
* **Measurable guidance** over generic advice.
* **Voice fidelity** with a user-controlled “authenticity ↔ growth” tradeoff.
* **Safe defaults** for quality, constraints, and platform fit.
* **Right action at the right time**: the extension exists because timing + context matter.

---

## Stack

This is a product overview repo (not the full codebase), but the implementation is built with:

* **Next.js** (App Router), **React**, **TypeScript**
* **Postgres** + **Prisma**
* Auth (e.g., NextAuth)
* Billing (Stripe)
* LLM orchestration with provider routing
* Tests for key policies + chat logic
* **Browser extension** (Chromium-based) as a companion client

---

## Status & access

This repository is a **public-facing overview** of **Xpo**.

* ✅ Product story, screenshots, and behavior
* ✅ System-level architecture and principles
* ❌ Full source code and production infrastructure (private)

If you’re a collaborator, investor, or want access for a deeper technical review, reach out.

---

## Roadmap

* Deeper postmortem loop (prediction vs outcome)
* Better reply ROI model + personalization
* More creator-specific strategy presets
* Expanded retrieval + memory controls
* Team/workspace collaboration

---

## Contact

* Founder: **Shernan Javier**
* X: [@yourhandle](https://x.com/yourhandle)
* Email: [you@domain.com](mailto:you@domain.com)
