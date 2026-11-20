# Design system: Bubblegum Binder

The source of truth for how reydiantfinds looks. Read this before any UI work.
Raw values live only in `app/globals.css`; restyling means changing them there.

## The idea
Her stock, kept in a bubblegum-pink Y2K binder. Colors come from the Figma community kit
"Y2K UI Kit | Retro Bubblegum Components" (adopted Nov 2026; the palette may still change, so
it lives only in tokens). Pale-pink cards sit on a bubblegum page; controls are glossy candy pills
with the kit's white rim. The **shell is plain iOS**: large titles,
a translucent bottom tab bar, inset grouped sections, switches, disclosure chevrons, sheets.
The Y2K world shows up in only four places, and nowhere else:

1. **Type:** Oxanium, the kit's own typeface (free on Google Fonts), for everything. Large titles
   are Oxanium 800 in pink with a soft candy drop shadow.
2. **Candy inks:** each tab owns one ink. Inventory is purple, Add is pink, Money is mint.
   Prices are always pink. Done ticks are always aqua.
3. **Gel-pen ticks:** prep steps that are done get a hand-drawn tick that inks itself on once.
4. **The holographic finish:** reserved for one meaning, **sold**. Never decoration.

If a new screen needs more "Y2K" than that, it's becoming a costume. Push back.

## Rules
- Never hardcode colors, sizes or spacing. Use the tokens below through their Tailwind classes.
  Tailwind's default palette is switched off, so `bg-zinc-100` won't work. That's on purpose.
- Phone-first at 390px. On a laptop (`lg`, 1024px+) the tab bar becomes a left sidebar and
  pages use the extra room: lists and reports go up to `max-w-wide`, the item form puts photos
  in a sticky left column.
- One-handed use: the primary action sits in the thumb zone (tab bar, pinned save button).
- Every tappable thing is at least 44px tall (`min-h-touch`). Inputs are 16px+ so iOS doesn't zoom.
- Photos are the hero. Chrome stays quiet so they stand out.
- Money is always `tabular` (lined-up figures) and right-aligned in lists.
- Light and dark mode both work; light is a bubblegum-pink page, dark is a deep plum page, not grey.
- Kit fidelity vs. readability: the kit sets text in hot pink (#DE1071, #F14B9A) that is under 4.5:1
  on its own page. We keep the kit's shapes, rims and gloss but use the deepened `ink-pink` for words.
- Icons come from `components/icons.tsx` (one stroke weight). No emoji or text glyphs as icons.
- Copy is plain language and sentence case. Buttons use active verbs ("Add item", "Mark as sold").
  Large titles are lowercase, like her shop name ("inventory", "money", "add a find").

## Tokens

### Color (light / dark switch automatically)
| Token | Class examples | Use |
|---|---|---|
| `bg` / `surface` | `bg-bg`, `bg-surface` | Bubblegum page; pale-pink grouped sections and cards |
| `surface-raised` | `bg-surface-raised` | White: inputs, chips, switch tracks |
| `surface-muted` | `bg-surface-muted` | Photo wells, skeletons |
| `edge` | `border-edge`, `ring-edge` | The kit's white rim on buttons, chips, cards and focused fields |
| `text` | `text-text` | Deep plum ink: main text, selected chips |
| `muted` | `text-muted` | Secondary text, hints |
| `hairline` / `border` | `border-hairline`, `ring-hairline` | Dividers, section edges |
| `ink-lilac` | `text-ink-lilac` | Purple: Inventory tab, back buttons, links |
| `ink-pink` | `text-ink-pink` | Labels, typed text, chip labels, prices, large titles |
| `ink-aqua` | `text-ink-aqua`, `bg-ink-aqua` | Mint: done ticks, the washed switch, Money tab |
| `*-glow` | `text-ink-lilac-glow` | Decoration only (title fill, empty-state art). Never for words. |
| `accent` / `on-accent` | `bg-accent text-on-accent` | The one primary button per screen (hot pink) |
| `success` / `warning` / `danger` | `text-danger` | States |
| `bar-glass` | `bg-bar-glass` | Translucent iOS tab bar and photo labels |

The text-safe ink shades are at least 4.5:1 on the page. The `*-glow` shades are not. Where the
kit's own shade was too light for words (its hot pink, mint, orange), the token uses a deepened
version and the kit shade becomes the glow. The full kit ramps are listed at the top of
`app/globals.css`; to change the palette, change the token values there.

### Type
- Oxanium for everything: 17px body and rows, 15px secondary and labels, 13px hints.
- `bubble-title` class: large titles only (Oxanium 800). 40px (30px for long item titles), 48px on a laptop.
- Weights: 400 body, 600 labels and rows, 800 prices.

### Spacing and shape
- Tailwind's 4px scale, plus `touch` (44px), `bar` (56px tab bar), `gutter` (16px),
  `sidebar` (248px), `max-w-page` (640px), `max-w-wide` (1080px).
- `rounded-pill` for every control: buttons, single-line inputs, search, chips, switches, nav items
  (the kit is all pills). `rounded-card` (16px) for sections, photos and multi-line text boxes.
  `rounded-control` (12px) only for list photos and skeletons.
- Kit effects: `shadow-candy` (gloss + pink drop) on the one primary button and the Add tab;
  `shadow-gloss` (gloss only) on selected chips and the switch knob; `shadow-pearl` (soft white shine)
  on chips, outline buttons and switch tracks; `shadow-glow` (pink halo) on a focused field;
  `shadow-pressed` while pressed. `shadow-card` for grouped sections, `shadow-sticker` for the holo sticker.

### Motion
- `ease-out-expo`, 150-200ms. Buttons and tiles scale down slightly while pressed.
- The gel tick draws on once (420ms) when a step becomes done. That's the one authored moment.
- Reduce Motion turns all of it off.

## Components
Shared class names live in `components/ui/styles.ts`: `inputClass`, `primaryButtonClass`,
`secondaryButtonClass`, `chipClass` (+ `chipSelectedPeer` / `chipSelectedPressed`), `labelClass`, `groupClass`.
Shapes follow the Figma kit's Button, Text Field, Segmented Control, Toggle and Checkbox components.

- **PageHeader** (`components/page-header.tsx`): 44px nav row (back button "‹ Inventory",
  trailing control such as the SKU), then the bubble large title. Every screen starts with one.
- **Tab bar / sidebar** (`components/bottom-nav.tsx`): Inventory, Add, Money. Add is a pink pill
  and the strongest item. Active tab takes its own ink.
- **Primary button**: glossy hot-pink pill, white rim, white label. One per screen.
- **Grouped section** (`groupClass`): pale-pink rounded card with a white rim, like iOS Settings.
  Collapsible ones use `<details>` with a chevron that turns.
- **Input**: white pill with a pink rim, pink typing. Focus: white rim plus pink halo. Red rim on error.
  Label above in pink (`labelClass`), hint or error below in 13px. Search is the same pill with a pink icon.
- **Chips**: white pills with the white rim and a pink label; selected ones turn into glossy candy
  (hot pink, white label). `Chips` picks one, `MultiChips` picks any. Filter chips and next-step pills share the style.
- **Switch**: white pill track with a pink rim; the knob is pale pink when off, glossy hot pink when on
  (see the "Washed and steamed" row).
- **Photo tile**: 4:5, dashed purple outline when empty, label badge on glass when filled.
- **PrepChecklist**: gel ticks (mint) and open gel circles (muted).
- **Item row** (`components/inventory/item-row.tsx`): 72px 4:5 photo, title, SKU and bin, pink price
  over "paid $x", four compact prep marks, and one pill for the next step ("Mark washed", "Mark listed"
  save on the spot; "Measure", "Add photos", "Add a price" open the item). The whole row opens the item.
  Listed 30+ days swaps the marks for a warning-coloured nudge to lower the price.
- **Background picker** (`components/background-picker.tsx`, on the Money screen): "Plain" plus the
  Y2K wallpapers, as 3:4 tiles; tap one and it applies at once. Saved per device (localStorage), applied
  before first paint by a tiny inline script, painted on a fixed layer behind everything (`.app-backdrop`).
  The pictures are pre-softened by `scripts/backgrounds.mjs`: each is squeezed into a light band (light
  mode) or a dim band (dark mode) so every text colour still reads at 4.5:1 on its darkest/lightest 1%.
  Cards and fields stay solid on top. Never show a raw wallpaper behind text.
- **Holo sticker** (`holo` class): small tilted label, only for Sold or Shipped.
- **Empty state**: hanger drawing, one sentence, one hint, the action that fixes it.
