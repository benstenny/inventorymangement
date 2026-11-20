import type { Metadata } from "next";
import { BackgroundPicker } from "@/components/background-picker";
import { EmptyState } from "@/components/empty-state";
import { LogOutButton } from "@/components/log-out-button";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Money" };

// Phase 6 replaces this with the monthly report, expenses and CSV export.
export default function SummaryPage() {
  return (
    <div className="mx-auto w-full max-w-wide">
      <PageHeader title="money" />
      <EmptyState
        message="Your profit shows up here after your first sale."
        hint="Every sale counts its fees, shipping and supplies, so the number is what you really made."
        action={{ href: "/items/new", label: "Add item" }}
      />
      <div className="mx-auto mt-10 w-full max-w-page">
        <BackgroundPicker />
      </div>
      <LogOutButton className="mx-auto mt-6 w-fit lg:hidden" />
    </div>
  );
}
