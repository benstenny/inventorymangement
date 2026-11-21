# Design system: Pearl Glass

The source of truth for how reydiantfinds looks. Read this before any UI work.
Raw values live only in `app/globals.css`; restyling means changing them there.

## The idea
Her stock behind frosted pearl glass. Drawn from the owner's "RetroVault" mockups (`mock ups/`,
Nov 2026): Y2K glossy kawaii, iridescent lavender and baby blue, holographic pearl, chrome and glass,
soft pink accents, glitter glints, high-gloss gel buttons, soft studio lighting, crisp edges.
The mockups are a look, not a spec: the app keeps its own screens and features, and the name
stays "reydiantfinds".

Three layers: a lavender -> baby-blue page with an iridescent haze and a few white glitter glints
(`html::before`) / frosted white glass cards with a crisp white rim and soft lavender shadow /
brighter glass fields. The shell is plain iOS: large titles, a glass bottom tab bar, inset grouped
sections, switches, sheets. The world shows in:

1. **Type:** Nunito (rounded, bold) everywhere. Large titles are Nunito 900 in deep indigo.
2. **Gel:** the primary button is a glossy pink -> lavender gel pill (`bg-candy gloss`); the Add tab is a
   glossy lavender orb that rises above the bar (`bg-orb gloss`); selected chips are deep indigo pills.
3. **Chrome:** the "reydiantfinds" wordmark only (login, sidebar): silver-lavender lettering with a
   white edge and a violet extrude (`wordmark`). Never chrome body text.
4. **Glints and holo:** faint four-point glitter glints on the page; the holographic finish only means
   **sold**. Gel-pen ticks ink themselves on for done prep steps.

3D-look art: the iridescent CD, puffy chrome stars and chrome sparkles are coded (CSS/SVG, no image
files) in `components/art/art.tsx`: `LoginArt` (CD with stars and sparkles above the centred wordmark)
and `EmptyArt` (a chrome star cluster in every empty state). The rest of the mockups' renders
(ribbon, butterfly, disco ball, puffy hearts) are image art: when the owner supplies transparent PNGs
(1024px+), they go in `public/art/` as small WebP. All art is decorative (aria-hidden) and lives only
on the login and in empty states, never behind lists or forms.

## Rules
- Never hardcode colors, sizes or spacing. Use the tokens below through their Tailwind classes.
  Tailwind's default palette is switched off, so `bg-zinc-100` won't work. That's on purpose.
- Phone-first at 390px. On a laptop (`lg`, 1024px+) the tab bar becomes a left glass sidebar and
  pages use the extra room: lists and reports go up to `max-w-wide`, the item form puts photos
  in a sticky left column.
- One-handed use: the primary action sits in the thumb zone (tab bar, pinned save button).
- Every tappable thing is at least 44px tall (`min-h-touch`). Inputs are 16px+ so iOS doesn't zoom.
- Photos are the hero. Glass stays quiet so they stand out.
- Money is always `tabular` (lined-up figures) and right-aligned in lists.
- Light and dark mode both work. Light: lavender page, white glass. Dark: deep indigo night glass,
  pale lavender selections, light-pink gel buttons with dark labels. Composed separately, not inverted.
- Mockup fidelity vs. readability: the mockups put white text on pale pink and lavender. Every text
  pairing here is checked at 4.5:1 or better on the darkest page stop and on glass over it.
- Icons come from `components/icons.tsx` (one stroke weight). No emoji or text glyphs as icons.
- Copy is plain language and sentence case. Buttons use active verbs ("Add item", "Mark as sold").
  Large titles are lowercase, like her shop name ("inventory", "money", "add a find").

## Tokens

### Color (light / dark switch automatically)
| Token | Class examples | Use |
|---|---|---|
| `bg` + `--page` | `bg-bg` | Lavender -> baby-blue page gradient (painted by `html::before` with haze and glints) |
| `surface` | `bg-surface` + `glass` | Frosted white glass cards (62% white + blur) with `ring-edge` |
| `surface-raised` | `bg-surface-raised` | Brighter glass: fields, chips, switch tracks (solid in dark mode) |
| `surface-muted` | `bg-surface-muted` | Pale lavender photo wells and skeletons |
| `edge` | `ring-edge`, `border-edge` | The crisp white rim on glass and gel |
| `border` / `hairline` | `border-border`, `divide-hairline` | Lavender outline on fields and chips / dividers and meter tracks |
| `text` | `text-text` | Deep indigo: titles, item names, what she types |
| `muted` | `text-muted` | Secondary text, hints |
| `ink-violet` | `text-ink-violet` | Labels, prices, chip labels, big money figures |
| `ink-lilac` | `text-ink-lilac` | Links, back buttons, the SKU · bin line |
| `ink-rose` | `text-ink-rose` | Soft-pink accent: the current tab |
| `ink-aqua` | `text-ink-aqua` | Mint: means "done". Text only on glass; on the page it's icon-only |
| `*-glow` | `border-ink-lilac-glow` | Decoration only. Never for words |
| `accent` / `on-accent` | `bg-accent` | Violet: switch knob, meter fill, focus |
| `--accent-gradient` | `bg-candy` | The gel button: pink -> lavender, white label |
| `--orb-gradient` | `bg-orb` | The Add tab's lavender orb |
| `selected` / `on-selected` | `bg-selected text-on-selected` | Selected chip: deep indigo pill (pale lavender in dark) |
| `success` / `warning` / `danger` | `text-danger` | States |
| `bar-glass` | `bg-bar-glass` + `glass` | Glass tab bar |

Each colour has one job: indigo = words and titles, violet = labels and money, lilac = where things
are, pink = where you are (current tab) and the gel button, mint = done, orange = "do something about
this", red = a loss or an error.

### Type
- Nunito for everything: 17px body and rows, 15px secondary and labels, 13px hints.
- `bubble-title`: large titles only (Nunito 900, indigo, white highlight; soft glow in dark mode).
  40px (30px for long item titles), 48px on a laptop.
- `wordmark`: the chrome "reydiantfinds", login and sidebar only.
- Weights: 400 body, 600-700 labels and rows, 800 prices and buttons.

### Spacing and shape
- Tailwind's 4px scale, plus `touch` (44px), `bar` (60px tab bar), `gutter` (16px),
  `sidebar` (248px), `max-w-page` (640px), `max-w-wide` (1080px).
- `rounded-pill` for every control: buttons, single-line inputs, search, chips, switches, nav items.
  `rounded-card` (20px) for sections, photos and multi-line text boxes. `rounded-control` (14px)
  for list photos and skeletons.
- Effects: `glass` (18px backdrop blur) on cards, tab bar and sidebar; `gloss` (a crisp pill of white
  light along the top, under the label, ending above the letters) on gel buttons, the Add orb and
  selected chips; `shadow-candy` (top light, deeper bottom rim, lavender drop) on the gel button and
  orb; `shadow-gloss` on selected chips and the switch knob; `shadow-pearl` (inner white shine) on
  fields, chips and secondary buttons; `shadow-glow` (lavender halo) on a focused field;
  `shadow-card` (soft lavender studio light) on glass; `shadow-pressed` while pressed.
  Keep it crisp: no stacks of blurry insets, no grey shadows.

### Motion
- `ease-out-expo`, 150-200ms. Buttons and tiles scale down slightly while pressed.
- The gel tick draws on once (420ms) when a step becomes done. That's the one authored moment.
- Reduce Motion turns all of it off.

## Components
Shared class names live in `components/ui/styles.ts`: `inputClass`, `primaryButtonClass`,
`secondaryButtonClass`, `chipClass` (+ `chipSelectedPeer` / `chipSelectedPressed`), `labelClass`, `groupClass`.
Shapes follow the mockups: glass pills, indigo selected chips, gel primary button.

- **PageHeader** (`components/page-header.tsx`): 44px nav row (back button "‹ Inventory",
  trailing control such as the SKU), then the bubble large title. Every screen starts with one.
- **Tab bar / sidebar** (`components/bottom-nav.tsx`): Inventory, Pack, Add, Money, Settings (5 tabs, the
  iPhone maximum), frosted glass. Add is the glossy lavender orb in the middle, rising above the bar.
  The current tab turns soft pink. Pack shows an orange count badge of sold items waiting to ship
  (`components/pack/pack-badge.tsx`, server-rendered). On a laptop: a glass sidebar with the chrome wordmark.
  **Push screens:** forms with a pinned save (add, edit, mark as sold, add expense) carry `data-push-screen`;
  on a phone the tab bar steps aside (pure CSS, `body:has(...)`), the save bar drops to the bottom edge
  clear of the home indicator (`bottom-(--tab-offset) pb-(--save-pad)`), and the header's back link returns.
- **Primary button**: glossy pink -> lavender gel pill, white rim, white label. One per screen.
- **Grouped section** (`groupClass`): frosted glass card with a white rim, like iOS Settings.
  Collapsible ones use `<details>` with a chevron that turns.
- **Input**: bright glass pill with a lavender outline and inner shine, indigo typing. Focus: violet
  outline plus lavender halo. Red outline on error. Label above in violet (`labelClass`), hint or error
  below in 13px. Search is the same pill with a violet icon.
- **Chips**: glass pills with a lavender outline and violet label; selected ones turn into deep indigo
  pills with a white label and a `gloss` highlight. `Chips` picks one, `MultiChips` picks any. Filter chips and next-step pills share the style.
- **Switch**: glass pill track with a lavender outline; the knob is pale when off, glossy violet when on
  (see the "Washed and steamed" row).
- **Photo tile**: 4:5, dashed purple outline when empty, label badge on glass when filled.
- **PrepChecklist**: gel ticks (mint) and open gel circles (muted).
- **Inventory home** (`components/inventory/inventory-list.tsx`): a summary line under the title
  ("1 to ship · 4 to prep · 3 listed"), search, filter chips that wrap (never hidden off-screen), then
  under "All" the list grouped by what to do next: To ship, To prep, Listed (`groupBySection`
  in lib/items/list.ts). Shipped (and handed-over) items leave "All" and live under the "Shipped" filter. Section headings are 20px bold indigo with a muted count; 28px between sections.
  Other filters show one flat list.
- **Item row** (`components/inventory/item-row.tsx`): 96px 4:5 photo (it sets the row height), title,
  SKU and bin in lilac, violet price
  over "paid $x", four compact prep marks, and one pill for the next step ("Mark washed", "Mark listed"
  save on the spot; "Measure", "Add photos", "Add a price" open the item). The whole row opens the item.
  Listed 30+ days swaps the marks for a warning-coloured nudge to lower the price.
- **Background picker** (`components/background-picker.tsx`, in Settings > Look): "Plain" plus the
  Y2K wallpapers, as 3:4 tiles; tap one and it applies at once. Saved per device (localStorage), applied
  before first paint by a tiny inline script, painted on a fixed layer behind everything (`.app-backdrop`).
  The pictures are pre-softened by `scripts/backgrounds.mjs`: each is squeezed into a light band (light
  mode) or a dim band (dark mode) so every text colour still reads at 4.5:1 on its darkest/lightest 1%.
  Glass cards sit on top. Never show a raw wallpaper behind text. "Plain" is the lavender page.
- **Mark as sold** (`components/sale/sale-form.tsx`, `/items/[id]/sold`): item summary card, "Sold on"
  chips, sold for + date, fees (filled in from the platform preset until she edits them) + shipping
  (hidden for flea market: handed over), "Paid by" chips for Instagram and flea market, optional note,
  then a live profit card (big violet figure, red if a loss, with the sum spelled out) and an orange
  "Take it down from …" note when it's listed elsewhere. Pinned "Mark as sold" button. After saving,
  a "Sold for $x" card with the profit, what happens next, and the take-down note again.
  Reached from the row's "Mark as sold" pill (listed, prepped items) or the item page.
- **Pack today** (`/pack`, `components/pack/pack-card.tsx`): sold items, oldest sale first. Each card:
  photo, title, SKU · bin (purple), platform and price, "Ship by Thu, Nov 19" with urgency in her
  words (muted "3 days left", orange "Ship by tomorrow", red "Ship today" / "2 days late", worked out
  from her local date), the buyer's note, then "Take proof photo" (opens the camera) and
  "Mark shipped", which stays disabled until the proof photo has uploaded. Only the most urgent card
  gets the primary button. Sold rows in the inventory list show a "Pack it" pill.
- **Money** (`/summary`, `components/money/`): ‹ month › switcher; profit card (big violet figure, red
  if a loss, then Sales and each deduction spelled out); Budgets as a meter list (name, "$96 of $130",
  8px bar on a `bg-hairline` track, fill violet -> orange from 90% -> red when over, and "$34 left" /
  "Over by $22" in words, never color alone), and a "Change budgets" link to
  `/settings#budgets`, where both are edited; Sold (each sale with its own profit); Expenses with "Add expense"
  (`/summary/expenses/new`: Supplies / Upkeep / Other chips, cost, date, note) and Remove; Backup
  (Items CSV, Expenses CSV).
- **Settings** (`/settings`, `components/settings/settings-form.tsx`): Look first (the background picker,
  applies at once, per device), then the shop rules saved together by one pinned "Save settings":
  Pricing (lowest price, haggle room, nudge after N days), Fees (percent + fixed per platform),
  Shipping (ship within N days), Budgets (stock, upkeep, live total), Suggestions (where I shop,
  storage spots: removable chips plus an add field). Short numbers are compact fields with the
  unit beside them ("30 days"). Log out at the bottom.
- **Add a find** (`/items/new`) asks only what she knows at the rack: photos ("now or later"), title,
  category (compact chips, two rows), cost and storage spot, then one "More details" row (brand, size,
  color, condition, flaws, notes, where and when, washed, price and "Help me price this"). No status,
  "Listed on" or measurements on Add: new finds start as Sourced, and washing, measuring and listing
  happen later from the list's next-step pills. **Edit** keeps every field.
- **Text box** (`textareaClass`): the input look with card corners; never pill ends on multi-line fields.
- **Holo sticker** (`holo` class): small tilted label, only for Sold or Shipped.
- **Empty state**: a chrome star cluster (`EmptyArt`), one sentence, one hint, the action that fixes it.
