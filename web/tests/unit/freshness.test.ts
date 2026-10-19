import { expect, test } from "vitest";

import { expectedSession, isSession, sessionsBehind } from "@/lib/freshness";
import { registry } from "@/lib/registry";

const at = (iso: string) => new Date(iso); // UTC instants

test("weekends and listed closures are not sessions in a weekday market (as equity and macro calendars will be)", () => {
  registry.calendars.test_exchange = { name: "Test exchange", every_day: false, closures: ["2025-12-25"] };
  try {
    expect(isSession("test_exchange", "2026-10-10")).toBe(false); // Saturday
    expect(isSession("test_exchange", "2025-12-25")).toBe(false); // listed closure
    expect(isSession("test_exchange", "2026-10-09")).toBe(true);
  } finally {
    delete registry.calendars.test_exchange;
  }
});

test("crypto trades every day; yesterday's UTC close is expected once it has been collected", () => {
  expect(isSession("crypto", "2026-10-18")).toBe(true); // a Sunday
  expect(expectedSession("crypto", at("2026-10-18T00:20:00Z"))).toBe("2026-10-16"); // 00:20 UTC: not collected yet
  expect(expectedSession("crypto", at("2026-10-18T01:30:00Z"))).toBe("2026-10-17"); // 01:30 UTC
  expect(expectedSession("crypto", at("2026-10-17T20:00:00Z"))).toBe("2026-10-16"); // the 17th is not over yet
  expect(sessionsBehind("crypto", "2026-10-15", at("2026-10-18T01:30:00Z"))).toBe(2); // weekend days count
  expect(sessionsBehind("crypto", "2026-10-17", at("2026-10-18T01:30:00Z"))).toBe(0);
});

test("a calendar with no publication hour is refused, not guessed", () => {
  registry.calendars.test_exchange = { name: "Test exchange", every_day: false, closures: [] };
  try {
    expect(() => expectedSession("test_exchange", at("2026-10-09T12:00:00Z"))).toThrow(/publication hour/);
  } finally {
    delete registry.calendars.test_exchange;
  }
});
