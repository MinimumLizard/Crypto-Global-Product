// Dates on this site are UTC days, as ISO strings (YYYY-MM-DD): a crypto day is 00:00 to 24:00 UTC (the day
// Bitstamp's daily candle covers), and every visitor, wherever they are, sees the same day.

export function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A real calendar date in a sensible range (Date.parse alone accepts 2026-02-30). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value && value >= "2000-01-01" && value <= "2099-12-31";
}
