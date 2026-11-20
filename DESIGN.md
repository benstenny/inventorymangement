# Design system: Gel Pen Binder

The source of truth for how reydiantfinds looks. Read this before any UI work.
Raw values live only in `app/globals.css`; restyling means changing them there.

## The idea
Her stock, written in gel pen on a clean white page. The **shell is plain iOS**: large titles,
a translucent bottom tab bar, inset grouped sections, switches, disclosure chevrons, sheets.
The Y2K world shows up in only four places, and nowhere else:

1. **Type:** bubble-letter large titles (Chewy, lilac fill with a plum ink outline). Everything
   else is the iPhone's own system font.
2. **Gel inks:** each tab owns one ink. Inventory is lilac, Add is pink, Money is aqua.
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
- Light and dark mode both work; dark is a deep plum page, not grey.
- Icons come from `components/icons.tsx` (one stroke weight). No emoji or text glyphs as icons.
- Copy is plain language and sentence case. Buttons use active verbs ("Add item", "Mark as sold").
  Large titles are lowercase, like her shop name ("inventory", "money", "add a find").

## Tokens

### Color (light / dark switch automatically)
| Token | Class examples | Use |
|---|---|---|
| `bg` / `surface` | `bg-bg`, `bg-surface` | Page; grouped sections and cards |
| `surface-muted` | `bg-surface-muted` | Filled inputs, chips, photo wells, search |
| `text` | `text-text` | Plum ink: main text, selected chips |
| `muted` | `text-muted` | Secondary text, hints |
| `hairline` / `border` | `border-hairline`, `ring-hairline` | Dividers, section edges |
| `ink-lilac` | `text-ink-lilac` | Inventory tab, back buttons, links |
| `ink-pink` | `text-ink-pink` | Prices, money figures, the Add action |
| `ink-aqua` | `text-ink-aqua`, `bg-ink-aqua` | Done ticks, the washed switch, Money tab |
| `*-glow` | `text-ink-lilac-glow` | Decoration only (title fill, empty-state art). Never for words. |
| `accent` / `on-accent` | `bg-accent text-on-accent` | The one primary button per screen (pink) |
| `success` / `warning` / `danger` | `text-danger` | States |
| `bar-glass` | `bg-bar-glass` | Translucent iOS tab bar and photo labels |

The text-safe ink shades are at least 4.5:1 on their background. The `*-glow` shades are not.

### Type
- System font (SF on iPhone) for everything: 17px body and rows, 15px secondary, 13px hints.
- `bubble-title` class: large titles only. 40px (30px for long item titles), 48px on a laptop.
- Weights: 400 body, 600 labels and rows, 800 prices.

### Spacing and shape
- Tailwind's 4px scale, plus `touch` (44px), `bar` (56px tab bar), `gutter` (16px),
  `sidebar` (248px), `max-w-page` (640px), `max-w-wide` (1080px).
- `rounded-control` (12px) for inputs and buttons, `rounded-card` (16px) for sections and photos,
  `rounded-pill` for chips, switches and the Add button.
- `shadow-card` for grouped sections, `shadow-float` (pink glow) only under the primary action,
  `shadow-sticker` for the holo sticker.

### Motion
- `ease-out-expo`, 150-200ms. Buttons and tiles scale down slightly while pressed.
- The gel tick draws on once (420ms) when a step becomes done. That's the one authored moment.
- Reduce Motion turns all of it off.

## Components
Shared class names live in `components/ui/styles.ts`: `inputClass`, `primaryButtonClass`,
`secondaryButtonClass`, `labelClass`, `groupClass`.

- **PageHeader** (`components/page-header.tsx`): 44px nav row (back button "‹ Inventory",
  trailing control such as the SKU), then the bubble large title. Every screen starts with one.
- **Tab bar / sidebar** (`components/bottom-nav.tsx`): Inventory, Add, Money. Add is a pink pill
  and the strongest item. Active tab takes its own ink.
- **Grouped section** (`groupClass`): white rounded section on the page, like iOS Settings.
  Collapsible ones use `<details>` with a chevron that turns.
- **Input**: filled (`bg-surface-muted`, no border), lilac ring on focus, red ring on error.
  Label above in `labelClass`, hint or error below in 13px.
- **Chips**: grey pills; selected ones turn plum with white text. `Chips` picks one, `MultiChips` picks any.
- **Switch**: iOS switch, aqua when on (see the "Washed and steamed" row).
- **Photo tile**: 4:5, dashed lilac outline when empty, label badge on glass when filled.
- **PrepChecklist**: gel ticks (aqua) and open gel circles (muted).
- **Holo sticker** (`holo` class): small tilted label, only for Sold or Shipped.
- **Empty state**: hanger drawing, one sentence, one hint, the action that fixes it.
