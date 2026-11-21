import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { BackgroundPicker } from "@/components/background-picker";
import { ChevronRightIcon } from "@/components/icons";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { LogOutButton } from "@/components/log-out-button";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { groupClass } from "@/components/ui/styles";
import { settingsToInput } from "@/lib/settings";
import { getShopSettings } from "@/lib/settings-data";

export const metadata: Metadata = { title: "Settings" };

/** Settings: the look (applies straight away, on this device) and the shop's rules (saved together). */
export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-page">
      <PageHeader title="settings" />

      <Link
        href="/settings/help"
        className={`${groupClass} mb-8 flex min-h-touch items-center justify-between gap-3 px-4 py-3 transition-transform duration-150 ease-out-expo active:scale-[0.98]`}
      >
        <span>
          <span className="block text-[17px] font-bold">How to use the app</span>
          <span className="block text-[15px] text-muted">Add, prep, sell, pack and money, step by step</span>
        </span>
        <ChevronRightIcon size={22} className="shrink-0 text-ink-lilac" />
      </Link>

      <section aria-labelledby="look-heading" className="mb-8">
        <h2 id="look-heading" className="mb-2.5 px-1 text-[20px] font-bold">
          Look
        </h2>
        <BackgroundPicker />
      </section>

      <Suspense fallback={<FormSkeleton />}>
        <ShopSettings />
      </Suspense>

      <LogOutButton className="mx-auto mt-4 w-fit" />
      {/* Room so Log out isn't hidden behind the pinned save button. */}
      <div className="h-16" aria-hidden />
    </div>
  );
}

async function ShopSettings() {
  // Her settings and the Supabase session are per request: never prerender this part.
  await connection();
  const settings = await getShopSettings();
  return <SettingsForm initial={settingsToInput(settings)} />;
}
