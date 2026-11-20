# Resale Inventory Manager

## Purpose
A simple, fast inventory app for a small clothing resale shop (thrifted Y2K and vintage clothing
sold on Depop, Instagram and at flea markets). The user is non-technical, new to selling, and will mostly use
it on her phone while sourcing, photographing and packing. Simplicity and speed of data entry
matter more than feature count. Build the smallest thing that works, then add only what real use asks for.

Two views of one app: a phone PWA (primary) and a desktop web view (same routes, more room).

## The shop (from her business plan, Nov 2026)
- Sells on **Depop**, **Instagram** and at **flea markets** (Instagram and markets are paid by Venmo,
  Zelle or cash). An item can be listed in several places at once.
- Sources from Thrift Vintage Fashion, OC Rag House, Goodwill, Salvation Army. About 1 hour and
  up to 20 lb per trip.
- Stores items in Costco bins labelled by type (Tops bin, Bottoms bin).
- 2.5 to 4.5 hours a week in total, so every screen must be quick. The first three months are
  about learning the market, not volume.
- Money: $130/month for stock, $70/month for upkeep (supplies, laundromat). Wants profit per item
  and per month as detailed reports, including supplies and other expenses.
- Prep: washes at a laundromat, steams at home, photographs on a mannequin, 3 photos per item
  (front, back, styled). Wants a per-item checklist: washed, measured, photographed, listed.
- Doesn't know how to measure clothes yet: the app shows a short guide next to each measurement.
- Pricing: gut feel plus research. Lowest price she'll take is about $10. Haggles $1-2, max $3.
  Wants a suggested minimum price per item and a nudge to lower prices after 30 days unsold.
- Shipping: packs at home, drops at the post office, ships within 3-5 days of a sale.
  All sales are final; she photographs each item before sealing the package, as proof.
- Doesn't want copy-paste listing text.
- Shop name, logo and style aren't decided yet. Keep the look neutral until they are.

## Tech Stack
- Next.js (App Router) + TypeScript, Tailwind CSS, installable PWA
- Supabase: Postgres (data), Storage (photos), Auth (single admin login, sign-ups disabled)
- Supabase JS client with Row Level Security on every table. No ORM unless we agree to add one.
- Zod for validation, Vitest for tests
- Hosting: Vercel. Free tiers only, with one approved exception: Gemini (paid tier, $5 budget alert, 30 calls/day
  cap in the app) for "Help me price this", because Google Search grounding isn't on the free tier.
  Answers are shown verbatim with Google's Search Suggestions and never stored (Google's terms).
- n8n is NOT part of v1. If the free Supabase project pauses from inactivity, use a Vercel cron
  hitting `/api/health`.

## Out of Scope
Direct marketplace API integrations (Depop's API is partner-only), multi-user accounts, payments,
tax reporting, offline mode (assume constant internet), returns (all sales are final),
copy-paste listing text. Depop, Instagram and flea market are labels on an item, not integrations.

## Data Model (keep it flat)
`items` table:
- id, sku (auto, short, e.g. "TOP-0042", prefix from category, never reused)
- title, brand, category (from a managed list), size, color, condition, description, flaws
- measurements (jsonb, inches; which ones depend on the category, see `lib/items/measurements.ts`)
- photos: photo_front_path, photo_back_path, photo_styled_path (compressed, in Supabase Storage)
- washed (bool): the one prep step that can't be worked out from other fields
- source, sourceCost (cents), acquiredDate, storageLocation
- status: SOURCED | NEEDS_PHOTOS | LISTED | SOLD | SHIPPED (RETURNED exists but has no UI: final sale)
- listedOn: list of platforms (DEPOP, INSTAGRAM, FLEA_MARKET; empty = not listed), listPrice (cents), listedDate
- Sale fields, empty until sold: soldPlatform (one of the three), soldPrice, soldDate,
  platformFees, shippingCost (all cents), paymentMethod (VENMO | ZELLE | CASH | DEPOP), buyerNotes
- Shipping: shippedDate, shipProofPath (photo taken before sealing the package)
- archivedAt (soft delete; never hard-delete items with sale history)

`expenses` table: spentOn, kind (SUPPLIES | UPKEEP | OTHER), amount (cents), note.
What she paid for items is not an expense; it lives on the item.

`settings` (one row): fee presets per platform (Instagram and flea market 0%; Depop is a preset, never hardcoded),
stale_days (30), min_price (cents, $10), haggle_room (cents, $3), ship_within_days (5),
inventory_budget and upkeep_budget (cents per month), sources and storage_spots (suggestion lists),
last-used defaults.

Derived, never stored: profit = soldPrice - sourceCost - platformFees - shippingCost,
margin %, days-to-sell, days-in-stock, prep checklist (washed / measured / photographed / listed),
suggested minimum price, ship-by date, monthly totals.

## Build Phases
Version 1 (build in this order)
1. Skeleton: Next.js, Supabase connection, RLS, admin login, `/api/health`, deploy-ready, README,
   `.env.example` (done)
2. Add/edit item (done), then updated for the business plan: 3 photos (front, back, styled),
   measurements with a how-to guide, flaws, washed, prep checklist, suggested minimum price,
   source and storage-spot suggestions
3. Inventory list: search, filters (all, needs photos, listed, unsold 30+ days), one-tap status
   changes, prep checklist at a glance (done)
4. Mark as sold: platform, price, fees (auto from preset), shipping, payment method (Instagram and markets),
   profit shown immediately, plus a reminder to take it down from the other places it was listed (done;
   flea market sales are handed over, so they skip "To ship")
5. Pack today: sold but not shipped, oldest first, with ship-by date; take a proof photo, then mark shipped
   (done: Pack tab with a count badge; the proof photo is required)
6. Money: add an expense, monthly report (sales, item costs, fees, shipping, expenses, profit,
   per-item table, spend vs budget), CSV export (monthly backup) (done; budgets can be changed
   from the Money tab: stock and upkeep per month)

Version 1.1 (only after she has used v1 for a few weeks)
- Enter a whole shopping trip at once, splitting total cost across items
- Settings screen: fee presets, minimum price, haggle room, budgets, sources, storage spots
- CSV import

Later, only if asked: shop branding (once she picks a name and style),
best/worst brand and category stats, n8n digests and automated backups.

## Photos
- Resize on the device before upload: ~1600px long edge, WebP or JPEG ~80%, target 200-400 KB.
  Small canvas-based helper in /lib, no new dependency.
- Up to 3 per item: front, back, styled (on the mannequin). Front is the hero in lists.
- These are reference photos. Full-quality originals go to Depop straight from her camera roll.

## Conventions
- Keep components small; business logic lives in /lib, not in components
- All money stored as integer cents; format only at the display layer
- Validate all input with Zod on both client and server
- Prefer server actions / route handlers over client-side fetching
- Never expose the Supabase service role key to the browser (no NEXT_PUBLIC_ prefix); secrets only in env vars
- No unnecessary dependencies; ask before adding one
- Write tests for profit calculations, pricing suggestions and status transitions
- Schema changes go in a new numbered file in `supabase/migrations/`; never edit one that has been run

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
- Plain-language labels, no jargon. Money words: "cost" (what she paid), "price" (asking),
  "sold for", "profit"

## Workflow
- Small, reviewable steps; run the app and tests after each feature
- Commit after each working feature with a clear message
- Before big decisions (schema changes, new libraries), explain options briefly
- Seed script with ~20 realistic sample items
- Keep README updated with setup, env vars, Supabase setup and Vercel deploy steps
- Tests: `npm test` (runs through `scripts/vitest.mjs`, which works around a Windows drive-letter bug)
