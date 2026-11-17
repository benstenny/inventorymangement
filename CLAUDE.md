# Resale Inventory Manager

## Purpose
A simple, fast inventory app for a small clothing resale shop (thrifted/secondhand items
sold on Depop and Instagram). The user is non-technical, new to selling, and will mostly use
it on her phone while sourcing, photographing and packing. Simplicity and speed of data entry
matter more than feature count. Build the smallest thing that works, then add only what real use asks for.

Two views of one app: a phone PWA (primary) and a desktop web view (same routes, more room).

## Tech Stack
- Next.js (App Router) + TypeScript, Tailwind CSS, installable PWA
- Supabase: Postgres (data), Storage (photos), Auth (single admin login, sign-ups disabled)
- Supabase JS client with Row Level Security on every table. No ORM unless we agree to add one.
- Zod for validation, Vitest for tests
- Hosting: Vercel. Free tiers only.
- n8n is NOT part of v1. If the free Supabase project pauses from inactivity, use a Vercel cron
  hitting `/api/health`.

## Out of Scope
Direct marketplace API integrations (Depop's API is partner-only; Instagram's does not track sales),
multi-user accounts, payments, tax reporting, offline mode (assume constant internet).
Depop and Instagram are labels on an item, not integrations.

## Data Model (v1: keep it flat)
One `items` table:
- id, sku (auto, short, e.g. "TOP-0042", prefix from category, never reused)
- title, brand, category (from a managed list), size, color, condition, description
- photo (one compressed image in Supabase Storage)
- source, sourceCost (cents), acquiredDate, storageLocation
- status: SOURCED | NEEDS_PHOTOS | LISTED | SOLD | SHIPPED | RETURNED
- listedOn: DEPOP | INSTAGRAM | BOTH, listPrice (cents), listedDate
- Sale fields, empty until sold: soldPlatform, soldPrice, soldDate, platformFees, shippingCost (all cents), buyerNotes
- archivedAt (soft delete; never hard-delete items with sale history)

A small `settings` table: fee presets per platform (Instagram 0%; Depop is a preset, never hardcoded),
stale-days threshold, last-used defaults.

Derived, never stored: profit = soldPrice - sourceCost - platformFees - shippingCost,
margin %, days-to-sell, days-in-stock.

## Build Phases
Version 1 (build in this order)
1. Skeleton: Next.js, Supabase connection, RLS, admin login, `/api/health`, deploy-ready, README, `.env.example`
2. Add/edit item with one compressed photo, title, cost, storage spot ("More details" collapsed)
3. Inventory list: search, status filter, one-tap status changes
4. Mark as sold: price, fees (auto from preset), shipping, profit shown immediately,
   plus a "take it down on the other platform" reminder
5. Copy listing text (title, brand, size, condition, description, flaws)
6. Small summary page: items in stock, money in, profit. CSV export button (monthly backup).

Version 1.1 (only after she has used v1 for a few weeks)
- Enter a whole shopping trip at once, splitting total cost across items
- Per-platform fee presets editor
- Stale-listing reminders
- CSV import

Later, only if asked: floor price and pricing notes, prep flags, returns workflow, supplies expenses,
best/worst brand and category stats, multiple photos per item, n8n digests and automated backups.

## Photos
- Resize on the device before upload: ~1600px long edge, WebP or JPEG ~80%, target 200-400 KB.
  Small canvas-based helper in /lib, no new dependency.
- These are reference photos. Full-quality originals go to platforms straight from her camera roll.

## Conventions
- Keep components small; business logic lives in /lib, not in components
- All money stored as integer cents; format only at the display layer
- Validate all input with Zod on both client and server
- Prefer server actions / route handlers over client-side fetching
- Never expose the Supabase service role key to the browser (no NEXT_PUBLIC_ prefix); secrets only in env vars
- No unnecessary dependencies; ask before adding one
- Write tests for profit calculations and status transitions

## Design
`DESIGN.md` in the repo root is the source of truth for tokens and components. Read it before any UI work.
Never hardcode colors, sizes or spacing; use the tokens. The look is neutral until the shop picks a style.
- For a new screen, propose a short layout plan first (ASCII wireframe is fine), then build phone-first (390px).
- One-handed use: primary action in the bottom thumb zone, touch targets at least 44px.
- Photos are the hero of the list. Avoid generic admin-template styling.
- Copy: plain language, sentence case, active verbs. Same name for an action everywhere. Empty states say what to do next.

## UX Rules
- Every core action takes 3 taps or fewer
- Forms: sensible defaults, remember last-used values (source, storage spot, platform)
- Plain-language labels, no jargon

## Workflow
- Small, reviewable steps; run the app and tests after each feature
- Commit after each working feature with a clear message
- Before big decisions (schema changes, new libraries), explain options briefly
- Seed script with ~20 realistic sample items
- Keep README updated with setup, env vars, Supabase setup and Vercel deploy steps
