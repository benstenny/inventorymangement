import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { PageHeader } from "@/components/page-header";
import { SaleForm } from "@/components/sale/sale-form";
import { primaryButtonClass } from "@/components/ui/styles";
import { getSaleItem } from "@/lib/items/data";
import { isInStock } from "@/lib/items/status";

export const metadata: Metadata = { title: "Mark as sold" };

export default function MarkSoldPage({ params }: PageProps<"/items/[id]/sold">) {
  return (
    <div className="mx-auto w-full max-w-page">
      <Suspense fallback={<FormSkeleton />}>
        <MarkSold params={params} />
      </Suspense>
    </div>
  );
}

async function MarkSold({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const found = await getSaleItem(id);
  if (!found) notFound();
  const { item, photoUrl, feePresets } = found;
  const back = { href: `/items/${item.id}`, label: "Item" };

  if (!isInStock(item.status)) {
    return (
      <>
        <PageHeader title="already sold" back={back} />
        <p className="text-[17px]">{item.title} is already marked as sold.</p>
        <Link href="/" className={`${primaryButtonClass} mt-6`}>
          Back to inventory
        </Link>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="mark as sold"
        back={back}
        trailing={<span className="tabular font-mono text-[15px] text-muted">{item.sku}</span>}
      />
      <SaleForm
        item={{
          id: item.id,
          title: item.title,
          cost: item.source_cost,
          listPrice: item.list_price,
          listedOn: item.listed_on ?? [],
          photoUrl,
        }}
        feePresets={feePresets}
      />
    </>
  );
}
