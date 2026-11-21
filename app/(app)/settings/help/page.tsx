import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { groupClass } from "@/components/ui/styles";

export const metadata: Metadata = { title: "How to use" };

type Section = { title: string; intro: string; steps?: string[]; points?: string[]; outro?: string };

/** Plain-language guide to the whole app, in the order she uses it: add, prep, sell, pack, money. */
const SECTIONS: Section[] = [
  {
    title: "Add a find",
    intro: "Tap the round + at the bottom. Only the title is needed, so you can add a piece in seconds at the store and finish it later.",
    points: [
      "Title and category (tap a chip, like Tops). The category gives it a code like TOP-0042.",
      "Cost: what you paid.",
      "Where you got it and storage spot (like “Tops bin”). The app remembers your last ones.",
      "Photos: front, back and styled. Add them now or later.",
      "More details: brand, size, color, condition, flaws, notes, and the Washed switch.",
      "Help me price this: searches Google for similar pieces and suggests a price, with its sources.",
    ],
    outro: "Tap Save item at the bottom.",
  },
  {
    title: "Prep it",
    intro: "Each piece on Inventory says what's left, like “To do: wash, measure, photos, list”.",
    points: [
      "Tap a piece to add measurements (a short guide sits next to each one), photos, and where it's listed.",
      "Quick buttons on the list, like Mark washed and Mark listed, move a piece along without opening it.",
      "Search by title, brand, code or bin. Filters: All, Needs photos, Listed, Unsold 30+ days, Shipped.",
      "After 30 days listed without selling, a piece shows “Try a lower price”.",
    ],
  },
  {
    title: "Sell it",
    intro: "Open the piece and tap Mark as sold. Your profit shows right away.",
    steps: [
      "Pick where it sold: Depop, Instagram or flea market.",
      "Enter what it sold for. Fees fill in for you.",
      "Enter the shipping you paid.",
      "For Instagram and markets, pick how they paid: Venmo, Zelle or cash.",
    ],
    outro: "Then take it down from the other places it was listed. Flea market sales are handed over, so they skip packing.",
  },
  {
    title: "Pack and ship",
    intro: "The Pack tab shows a number when something is waiting, oldest first, each with a Ship by date.",
    steps: [
      "Pack the piece.",
      "Take the proof photo before you seal it. All sales are final, so this is your proof.",
      "Tap Mark shipped.",
    ],
    outro: "Shipped pieces leave your list. Find them under the Shipped filter.",
  },
  {
    title: "Money",
    intro: "The Money tab shows one month at a time. Use the arrows to switch months.",
    points: [
      "Profit: sales minus what you paid for those pieces, fees, shipping and expenses.",
      "Write this month's summary: a short note on what made money, what's sitting, and one thing to try.",
      "Budgets: stock and upkeep, spent against what you planned.",
      "Add expense: supplies, laundromat and the like. What you paid for pieces is already counted.",
      "Backup: download your items and expenses as a spreadsheet at the end of each month.",
    ],
  },
  {
    title: "Settings",
    intro: "Change any of these whenever you like.",
    points: [
      "Background: a picture behind every screen on this phone.",
      "Pricing: your lowest price, the most you'll come down, and when to nudge a lower price.",
      "Fees, ship-within days, budgets, and your lists of stores and storage spots.",
    ],
  },
  {
    title: "Good to know",
    intro: "A few things worth remembering.",
    points: [
      "Price help and the monthly summary share 30 AI checks a day.",
      "Delete forever, at the bottom of a piece's edit page, removes it with its sale, profit and photos. It can't be undone.",
      "Log out is at the bottom of Settings.",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-page pb-8">
      <PageHeader title="how to use" back={{ href: "/settings", label: "Settings" }} />
      <p className="mb-6 px-1 text-[17px] text-muted">
        Every piece goes from the rack to the buyer in five steps: add it, prep it, sell it, pack it, and see what you made.
      </p>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((s, i) => (
          <section key={s.title} aria-labelledby={`help-${i}`} className={`${groupClass} p-4`}>
            <h2 id={`help-${i}`} className="mb-1.5 text-[20px] font-bold">
              {s.title}
            </h2>
            <p className="text-[16px] leading-relaxed">{s.intro}</p>
            {s.steps && (
              <ol className="mt-2.5 flex list-decimal flex-col gap-1.5 pl-6 text-[16px] leading-relaxed marker:font-bold marker:text-ink-violet">
                {s.steps.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            )}
            {s.points && (
              <ul className="mt-2.5 flex list-disc flex-col gap-1.5 pl-6 text-[16px] leading-relaxed marker:text-ink-violet">
                {s.points.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {s.outro && <p className="mt-2.5 text-[16px] leading-relaxed">{s.outro}</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
