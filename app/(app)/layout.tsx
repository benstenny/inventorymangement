import { BottomNav } from "@/components/bottom-nav";
import { logOut } from "@/app/login/actions";

/** Shell for every logged-in page. proxy.ts keeps logged-out visitors out. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-page items-center justify-between px-gutter pt-[env(safe-area-inset-top)]">
        <span className="font-semibold">Inventory</span>
        <form action={logOut}>
          <button type="submit" className="min-h-touch px-2 text-sm text-muted">
            Log out
          </button>
        </form>
      </header>

      <main className="mx-auto w-full max-w-page flex-1 px-gutter pt-2 pb-[calc(var(--spacing-bar)+env(safe-area-inset-bottom)+--spacing(6))]">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
