"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { BoxIcon, HangerIcon, MoneyIcon, PlusIcon } from "@/components/icons";
import { LogOutButton } from "@/components/log-out-button";

/**
 * Each tab owns one ink: Inventory purple, Add pink, Pack orange (it's a to-do), Money mint.
 * Pack shows a count of sold items waiting to ship (`packBadge`, rendered on the server).
 * Phone: an iOS tab bar in the thumb zone. Laptop (lg): a sidebar with the same links.
 */
const links = [
  { href: "/", label: "Inventory", Icon: HangerIcon, ink: "text-ink-lilac" },
  { href: "/items/new", label: "Add", Icon: PlusIcon, ink: "text-ink-pink", primary: true },
  { href: "/pack", label: "Pack", Icon: BoxIcon, ink: "text-warning" },
  { href: "/summary", label: "Money", Icon: MoneyIcon, ink: "text-ink-aqua" },
] as const;

type NavLink = (typeof links)[number];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/" || (pathname.startsWith("/items/") && pathname !== "/items/new");
  return pathname === href;
}

/** App navigation. The current tab is only known at request time, so it streams in. */
export function BottomNav({ packBadge }: { packBadge?: ReactNode }) {
  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-bar-glass pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      >
        <Suspense fallback={<TabBar pathname={null} packBadge={packBadge} />}>
          <CurrentTabBar packBadge={packBadge} />
        </Suspense>
      </nav>

      <nav
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-20 hidden w-sidebar flex-col border-r border-hairline bg-surface px-4 pt-8 pb-6 lg:flex"
      >
        <p className="bubble-title mb-8 px-2 text-3xl">reydiantfinds</p>
        <Suspense fallback={<SideLinks pathname={null} packBadge={packBadge} />}>
          <CurrentSideLinks packBadge={packBadge} />
        </Suspense>
        <div className="mt-auto">
          <LogOutButton />
        </div>
      </nav>
    </>
  );
}

type BadgeProps = { packBadge?: ReactNode };

function CurrentTabBar({ packBadge }: BadgeProps) {
  return <TabBar pathname={usePathname()} packBadge={packBadge} />;
}

function CurrentSideLinks({ packBadge }: BadgeProps) {
  return <SideLinks pathname={usePathname()} packBadge={packBadge} />;
}

function TabBar({ pathname, packBadge }: { pathname: string | null } & BadgeProps) {
  return (
    <ul className="mx-auto grid h-bar max-w-page grid-cols-4">
      {links.map((link) => (
        <li key={link.href} className="flex">
          <TabLink link={link} active={isActive(pathname, link.href)} badge={link.href === "/pack" ? packBadge : null} />
        </li>
      ))}
    </ul>
  );
}

function TabLink({ link, active, badge }: { link: NavLink; active: boolean; badge?: ReactNode }) {
  const { Icon } = link;
  if ("primary" in link) {
    return (
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        className="group flex flex-1 flex-col items-center justify-center gap-0.5"
      >
        <span className="flex h-9 w-14 items-center justify-center rounded-pill border-2 border-edge bg-accent gloss text-on-accent shadow-candy transition-transform duration-150 ease-out-expo group-active:scale-90">
          <Icon size={22} />
        </span>
        <span className={`text-[11px] font-semibold ${active ? link.ink : "text-muted"}`}>{link.label}</span>
      </Link>
    );
  }
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`group flex flex-1 flex-col items-center justify-center gap-0.5 ${active ? link.ink : "text-muted"}`}
    >
      <span className="relative">
        <Icon size={26} className="transition-transform duration-150 ease-out-expo group-active:scale-90" />
        {badge && <span className="absolute -top-1.5 -right-2.5">{badge}</span>}
      </span>
      <span className="text-[11px] font-semibold">{link.label}</span>
    </Link>
  );
}

function SideLinks({ pathname, packBadge }: { pathname: string | null } & BadgeProps) {
  return (
    <ul className="flex flex-col gap-1">
      {links.map(({ href, label, Icon, ink, ...rest }) => {
        const active = isActive(pathname, href);
        const primary = "primary" in rest;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                primary
                  ? "my-2 flex min-h-touch items-center gap-3 rounded-pill border-2 border-edge bg-accent gloss px-4 font-semibold text-on-accent shadow-candy"
                  : `flex min-h-touch items-center gap-3 rounded-pill px-4 font-semibold transition-colors ${
                      active ? `bg-surface-raised shadow-pearl ${ink}` : "text-muted hover:bg-surface-raised hover:text-text"
                    }`
              }
            >
              <Icon size={22} />
              {primary ? "Add item" : label}
              {href === "/pack" && packBadge && <span className="ml-auto">{packBadge}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
