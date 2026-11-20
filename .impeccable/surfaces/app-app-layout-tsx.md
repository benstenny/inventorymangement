---
version: 1
slug: "app-app-layout-tsx"
primary_target: "app/(app)/layout.tsx"
related_targets: ["app/(app)/page.tsx","app/(app)/items/new/page.tsx","app/(app)/items/[id]/page.tsx","app/(app)/summary/page.tsx","app/login/page.tsx"]
---

Scope: the whole logged-in app shell and its screens (inventory home, add/edit item, summary, login). Mode: operate.
Audience and job: the reydiantfinds owner on her iPhone, one-handed, adding and tracking thrifted Y2K pieces; on a laptop for long lists and reports.
Constraints: native iOS feel (large titles, bottom tab bar, native controls, safe areas); laptop gets a centered column plus room; 44pt targets; 16px inputs; light and dark.
Chosen direction: Gel Pen Binder (user locked it on the decision page, Y2K-steered re-roll).
Unresolved: inventory list, pack and money screens are later phases; they inherit this world.

## Direction contract
THESIS: Her stock written in gel pen on a clean white page. Refuses the grey SaaS inventory table and the glitter-scrapbook costume alike: the shell is plain iOS; the world shows only in type, ink colours, and one sticker.
OWN-WORLD: White ground (dark mode: deep plum page). Ink is near-black plum #2a1a4a. Gel inks: lilac #b57cff (Inventory), pink #ff5fb8 (prices, Add), aqua #21b8c4 (done ticks), lime #b6f24a (highlight). Bubble-letter display (Chewy) with an ink outline for large titles only; system SF for everything else. Prices in heavy pink tabular numerals. The holographic iridescent finish exists for one meaning: SOLD.
STORY: She opens the app, sees her finds with prices and prep ticks, taps Add in the thumb zone, shoots front/back/styled, saves in three taps, and knows what to do next.
FIRST VIEWPORT: Status-bar-safe large bubble title, search field, filter chips, photo-led rows (72x92 photo, title, SKU and bin, gel-pen ticks, pink price right-aligned over "paid $x"); translucent iOS tab bar at the bottom with Inventory, Add (pink, strongest), Money; Add form keeps its save button pinned above the tab bar.
FORM: Gel Pen Binder, grounded list position 5 of 7 (assigned by the roll). seed:ad2c59ffb61ce6a4. Raises: money in right-aligned tabular numerals (from Datamatics); each tab owns one gel ink (from Acetate Tab Manual); holographic reserved for sold (from Terminal Yellow).
Signature move: gel-ink check marks that draw on when a prep step is done, and the holographic SOLD sticker.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
