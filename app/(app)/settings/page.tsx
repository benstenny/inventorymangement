import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BackgroundPicker } from "@/components/background-picker";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { LogOutButton } from "@/components/log-out-button";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { settingsToInput } from "@/lib/settings";
import { getShopSettings } from "@/lib/settings-data";

export const metadata: Metadata = { title: "Settings" };

/** Settings: the look (applies straight away, on this device) and the shop's rules (saved together). */
export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-page">
      <PageHeader title="settings" />

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
