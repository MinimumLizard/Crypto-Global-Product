// Is the data as recent as the market calendar says it should be? Computed on the server, from the trading
// calendars in config/calendars (copied into the generated registry), so a page can say when it is behind.
import { registry } from "./registry";
import { addDays } from "./time";

// Hour (UTC) after which a session's data is normally published and collected. A weekday market's calendar gets its
// own hour here when it is added.
// Crypto: a UTC day is collected at 00:17 UTC (repair run 06:17); by 01:00 yesterday's close is expected.
const PUBLISHED_BY_HOUR: Record<string, number> = { crypto: 1 };

export function isSession(calendar: string, iso: string): boolean {
  const cal = registry.calendars[calendar];
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return (cal.every_day || (day !== 0 && day !== 6)) && !cal.closures.includes(iso);
}

/** The latest session whose data should have been published by `now`. */
export function expectedSession(calendar: string, now: Date = new Date()): string {
  const hour = PUBLISHED_BY_HOUR[calendar];
  if (hour === undefined) throw new Error(`no publication hour for calendar ${calendar}: add it to PUBLISHED_BY_HOUR`);
  let day = now.toISOString().slice(0, 10);
  if (now.getUTCHours() + now.getUTCMinutes() / 60 < hour) day = addDays(day, -1);
  // a market that never closes publishes a UTC day after it ends: the expected day is the one before
  if (registry.calendars[calendar].every_day) day = addDays(day, -1);
  while (!isSession(calendar, day)) day = addDays(day, -1);
  return day;
}

/** Sessions that should exist after `dataDate`, up to and including the expected one. */
export function sessionsBehind(calendar: string, dataDate: string, now: Date = new Date()): number {
  const expected = expectedSession(calendar, now);
  let n = 0;
  for (let d = addDays(dataDate, 1); d <= expected; d = addDays(d, 1)) if (isSession(calendar, d)) n += 1;
  return n;
}
