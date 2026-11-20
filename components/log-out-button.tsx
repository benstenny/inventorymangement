import { logOut } from "@/app/login/actions";
import { LogOutIcon } from "@/components/icons";

/** Ends the session. Lives in the laptop sidebar and on the Money screen on a phone. */
export function LogOutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logOut} className={className}>
      <button
        type="submit"
        className="flex min-h-touch w-full items-center gap-3 rounded-pill px-4 font-medium text-muted transition-colors hover:bg-surface-muted hover:text-text"
      >
        <LogOutIcon size={20} />
        Log out
      </button>
    </form>
  );
}
