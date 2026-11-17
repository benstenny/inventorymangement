"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Items" },
  { href: "/items/new", label: "Add item", primary: true },
  { href: "/summary", label: "Summary" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || (pathname.startsWith("/items/") && pathname !== "/items/new");
  return pathname === href;
}

/** App navigation, fixed in the thumb zone at the bottom of the screen. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 bg-surface pb-[env(safe-area-inset-bottom)] shadow-bar"
    >
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
    </nav>
  );
}
