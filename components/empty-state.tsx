import Link from "next/link";
import { EmptyArt } from "@/components/art/art";
import { PlusIcon } from "@/components/icons";
import { primaryButtonClass } from "@/components/ui/styles";

type Props = {
  message: string;
  hint?: string;
  action?: { href: string; label: string };
};

/** One sentence about what's missing, plus the action that fixes it. */
export function EmptyState({ message, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
      <EmptyArt />
      <p className="max-w-[28ch] text-lg font-semibold text-balance">{message}</p>
      {hint && <p className="mt-2 max-w-[34ch] text-muted text-balance">{hint}</p>}
      {action && (
        <Link href={action.href} className={`${primaryButtonClass} mt-7 w-auto gap-2 px-6`}>
          <PlusIcon size={20} />
          {action.label}
        </Link>
      )}
    </div>
  );
}
