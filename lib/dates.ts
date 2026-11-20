/** Date helpers for plain "YYYY-MM-DD" dates (the database's `date` columns). */

/** Today as YYYY-MM-DD (UTC, matching how dates are stamped on the server). */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). Never negative. */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor(ms / 86_400_000));
}
