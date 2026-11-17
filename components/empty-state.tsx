import Link from "next/link";

type Props = {
  message: string;
  action?: { href: string; label: string };
};

/** One sentence about what's missing, plus the action that fixes it. */
export function EmptyState({ message, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border px-6 py-12 text-center">
      <p className="text-muted">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="flex min-h-touch items-center rounded-control bg-accent px-5 font-medium text-on-accent"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
