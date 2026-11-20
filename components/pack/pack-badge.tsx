import { connection } from "next/server";
import { countToShip } from "@/lib/items/data";

/** The Pack tab's count of sold items waiting to ship. Nothing when there's nothing to pack. */
export async function PackBadge() {
  await connection();
  let count = 0;
  try {
    count = await countToShip();
  } catch (err) {
    // A missing badge shouldn't break the page; the Pack screen shows the real list.
    console.error(err);
    return null;
  }
  if (count === 0) return null;
  return (
    <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-pill bg-warning px-1.5 text-[12px] leading-none font-bold text-on-accent">
      <span aria-hidden>{count}</span>
      <span className="sr-only">, {count === 1 ? "1 to ship" : `${count} to ship`}</span>
    </span>
  );
}
