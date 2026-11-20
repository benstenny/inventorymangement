"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const links = [
  { href: "/", label: "Items" },
  { href: "/items/new", label: "Add item", primary: true },
  { href: "/summary", label: "Summary" },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/" || (pathname.startsWith("/items/") && pathname !== "/items/new");
  return pathname === href;
}

/** App navigation, fixed in the thumb zone at the bottom of the screen. */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 bg-surface pb-[env(safe-area-inset-bottom)] shadow-bar"
    >
      {/* The current address is only known at request time on dynamic pages, so the
          highlighted tab streams in; the same links render immediately without it. */}
      <Suspense fallback={<NavLinks pathname={null} />}>
        <CurrentNavLinks />
      </Suspense>
    </nav>
  );
}

function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="mx-auto grid h-bar max-w-page grid-cols-3 items-center gap-2 px-gutter">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        const primary = "primary" in link;
        return (
          <li key={link.href} className="flex justify-center">
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                primary
                  ? "flex min-h-touch w-full items-center justify-center rounded-pill bg-accent px-4 font-medium text-on-accent"
                  : `flex min-h-touch w-full items-center justify-center rounded-control ${
                      active ? "font-medium text-text" : "text-muted"
                    }`
              }
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
