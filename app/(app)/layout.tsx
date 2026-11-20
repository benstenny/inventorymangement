import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { PackBadge } from "@/components/pack/pack-badge";

/**
 * Shell for every logged-in page. proxy.ts keeps logged-out visitors out.
 * Phone: full-width page with the tab bar at the bottom. Laptop: sidebar on the left,
 * content in a centred column (each page picks its own width: forms narrow, lists wide).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:pl-sidebar">
      <main className="flex w-full flex-1 flex-col px-gutter pb-[calc(var(--spacing-bar)+env(safe-area-inset-bottom)+--spacing(8))] lg:px-10 lg:pb-12">
        {children}
      </main>
      <BottomNav
        packBadge={
          <Suspense fallback={null}>
            <PackBadge />
          </Suspense>
        }
      />
    </div>
  );
}
