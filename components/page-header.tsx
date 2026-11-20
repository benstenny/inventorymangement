import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

type Props = {
  title: string;
  /** iOS back button: "‹ Inventory". */
  back?: { href: string; label: string };
  /** A small trailing control in the nav row, e.g. the item's SKU or "Log out". */
  trailing?: React.ReactNode;
  children?: React.ReactNode;
};

/**
 * iOS-style large title header: a 44pt nav row (back button, trailing control),
 * then the bubble-letter title. Below the status bar on phones (safe area).
 */
export function PageHeader({ title, back, trailing, children }: Props) {
  return (
    <header className="pt-[env(safe-area-inset-top)] lg:pt-6">
      <div className="-mx-2 flex min-h-touch items-center justify-between gap-3">
        {back ? (
          <Link
            href={back.href}
            className="flex min-h-touch items-center gap-0.5 pr-3 text-[17px] font-medium text-ink-lilac"
          >
            <ChevronLeftIcon size={26} />
            {back.label}
          </Link>
        ) : (
          <span />
        )}
        {trailing}
      </div>
      <h1
        className={`bubble-title mt-1 mb-4 text-balance ${
          title.length > 18 ? "text-[30px] leading-[1.08] lg:text-4xl" : "text-[40px] lg:text-5xl"
        }`}
      >
        {title}
      </h1>
      {children}
    </header>
  );
}
