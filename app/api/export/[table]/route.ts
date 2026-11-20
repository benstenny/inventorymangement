import { exportExpensesCsv, exportItemsCsv } from "@/lib/money-data";
import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/dates";

/**
 * The monthly backup: /api/export/items or /api/export/expenses downloads a CSV.
 * proxy.ts already sends logged-out visitors to /login; this checks again, and
 * Row Level Security means the queries only ever see her own data.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/export/[table]">) {
  const { table } = await ctx.params;
  if (table !== "items" && table !== "expenses") return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return new Response("Log in first.", { status: 401 });

  try {
    const csv = table === "items" ? await exportItemsCsv() : await exportExpensesCsv();
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reydiantfinds-${table}-${todayIso()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Couldn't make the backup. Try again in a minute.", { status: 500 });
  }
}
