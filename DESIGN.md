# Design system

The source of truth for how the app looks. Read this before any UI work.
The look is deliberately neutral (warm greys, near-black accent) until the shop picks a style.
Restyling should only mean changing the values in `app/globals.css`.

## Rules
- Never hardcode colors, sizes or spacing. Use the tokens below through their Tailwind classes.
  Tailwind's default palette is switched off, so `bg-zinc-100` won't work. That's on purpose.
- Phone-first at 390px wide. Desktop is the same layout, centered, capped at `max-w-page`.
- One-handed use: the primary action sits in the bottom thumb zone.
- Every tappable thing is at least 44px tall (`min-h-touch`).
- Photos are the hero. Keep chrome quiet so they stand out.
- Copy is plain language and sentence case. Buttons use active verbs ("Add item", "Mark as sold").
  The same action has the same name everywhere. Empty states say what to do next.

## Tokens

### Color (light / dark switch automatically)
| Token | Class examples | Use |
|---|---|---|
| `bg` | `bg-bg` | Page background |
| `surface` | `bg-surface` | Cards, sheets, inputs |
| `surface-muted` | `bg-surface-muted` | Photo placeholders, subtle fills, selected chips |
| `text` | `text-text` | Main text |
| `muted` | `text-muted` | Secondary text, hints, labels |
| `border` | `border-border` | Dividers, input borders |
| `accent` / `on-accent` | `bg-accent text-on-accent` | Primary buttons, active nav item |
| `success` | `text-success` | Profit, "Sold" |
| `warning` | `text-warning` | Needs attention (needs photos, stale) |
| `danger` | `text-danger` | Errors, losses, destructive actions |
| `focus` | (automatic) | Keyboard focus ring |

### Spacing
Tailwind's 4px scale (`p-1` = 4px, `p-4` = 16px), plus:
- `touch` (44px): minimum height/width of anything tappable
- `bar` (64px): bottom nav height
- `gutter` (16px): page side padding on phones (`px-gutter`)
- `max-w-page` (640px): content width on desktop

### Type
Geist Sans. Tailwind sizes: `text-sm` (hints, meta), `text-base` (body, inputs; never smaller in
inputs, or iOS zooms in), `text-lg` (card titles), `text-2xl` (page titles). Weights: 400 body,
500 labels and buttons, 600 titles.

### Shape
- `rounded-control` (10px): buttons, inputs, chips
- `rounded-card` (14px): cards, photos, sheets
- `rounded-pill`: status badges
- `shadow-card` for cards, `shadow-bar` for the bottom nav. Keep shadows light.

## Components
Shared class names live in `components/ui/styles.ts` (`inputClass`, `primaryButtonClass`, ...).
Ready-made pieces: `Field` (label + input + error) and `Chips` (single choice) in `components/ui/`.

### Button
- Primary: `bg-accent text-on-accent`, `min-h-touch`, `rounded-control`, `font-medium`, full width on phone.
- Secondary: `bg-surface border border-border text-text`, same sizing.
- At most one primary button per screen.

### Input
`bg-surface border border-border rounded-control min-h-touch px-3 text-base`.
The label sits above the input in `text-sm font-medium`. Hints and errors go below it in `text-sm`
(`text-muted` / `text-danger`).

### Card
`bg-surface rounded-card shadow-card`. Item cards lead with the photo (square, `rounded-card`,
`bg-surface-muted` placeholder), followed by the title, price and status badge.

### Chip (filters)
`min-h-touch px-4 rounded-pill border border-border`. Selected: `bg-accent text-on-accent`.

### Bottom bar (app nav)
Fixed to the bottom, `h-bar` plus the safe-area inset, `bg-surface shadow-bar`. Three items:
Items, Add, Summary. Add is the visually strongest. The active item uses `text-text font-medium`,
the rest `text-muted`.

### Empty state
One short sentence saying what's missing, plus the action to fix it ("No items yet. Add your first one.").
