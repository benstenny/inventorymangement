# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
One user: the owner of **reydiantfinds**, a small resale shop for thrifted Y2K and vintage clothing.
She's new to selling and non-technical, with 2.5 to 4.5 hours a week for the whole business.

- **On her iPhone (primary), often one-handed:** adding items while thrifting or right after a trip,
  photographing on the mannequin (front, back, styled), measuring, marking things sold, and packing orders.
- **On a laptop (secondary):** browsing long inventory lists and reading detailed monthly money reports.

## Product Purpose
A private inventory app that follows each piece from the thrift store to the buyer: what she paid,
where it's stored, how far it is through prep, where it's listed, what it sold for, and the real profit
after fees, shipping and supplies. Success in the first three months is learning the market: knowing
which finds make money and never losing track of an item or a sale.

## Positioning
Built around one person's actual routine (her stores, her bins, her mannequin photos, her haggling
limits and budgets) rather than a generic inventory or marketplace tool. It doesn't post to marketplaces.
It's the single place her numbers and her prep checklist live.

## Operating Context
- Sources at Thrift Vintage Fashion, OC Rag House, Goodwill and Salvation Army (about 1 hour, up to 20 lb a trip).
- Washes at a laundromat, steams at home, photographs on a mannequin, stores items in Costco bins (Tops bin, Bottoms bin).
- Sells on Depop, Instagram and at flea markets; an item can be listed in several places at once.
  Instagram and market sales are paid by Venmo, Zelle or cash.
- Packs at home and drops at the post office within 3-5 days of a sale. All sales are final; she
  photographs each item before sealing the package as proof.
- Uses it standing up in stores, at a flea-market table, and at home. Assume a constant internet connection.

## Capabilities and Constraints
- Installed to the iPhone home screen as a PWA; the same app runs in a laptop browser. One app, same routes.
- **Binding requirement from the owner's side:** on the iPhone it should look and feel like a native
  iOS app, not a website. On a laptop it must still work well and use the extra room.
- Core screens: add/edit item, inventory list, mark as sold, pack today, money (expenses and monthly report).
- Each item: SKU, title, category, brand, size, color, condition, flaws, measurements (inches, per
  category, with a how-to guide), 3 photos, washed flag, source, cost, storage spot, status
  (Sourced, Needs photos, Listed, Sold, Shipped), listed on, price, sale details.
- Pricing helpers: lowest price she'll take (about $10), haggle room (up to $3), a suggested minimum per
  item, and a nudge to lower the price after 30 days unsold.
- Stack: Next.js, Tailwind, Supabase, Vercel, free tiers only. Single login. No marketplace integrations,
  payments, taxes, returns or copy-paste listing text.
- Terms she uses: "cost" (what she paid), "price" (asking), "sold for", "profit".

## Brand Commitments
- Shop name: **reydiantfinds** (as she writes it, lowercase). No logo, colors or fonts chosen yet.
- Shop accounts she admires: @shopthealternative, @samweston (named as references for how her shop
  should feel, not as anything to copy).

## Evidence on Hand
- No real item photos, sales or customers yet; the database is empty. A seed script adds 20 sample items
  for testing only. Never present sample data as her real results.

## Product Principles
1. Every core action takes three taps or fewer, one-handed, thumb-reachable.
2. Her items' photos are the content; the app stays out of their way.
3. Numbers are honest: profit always counts fees, shipping and supplies.
4. Plain words, never jargon. Each screen tells her what to do next.
5. Feels like an iPhone app in the hand, and stays a capable tool on a laptop.

## Accessibility & Inclusion
Touch targets at least 44pt, text inputs at least 16px (stops iOS zooming in), works in light and dark
mode, readable outdoors at a flea market, respects Reduce Motion.
