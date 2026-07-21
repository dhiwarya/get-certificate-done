import assert from "node:assert/strict";
import test from "node:test";
import { daysBetween, zonedDateKey } from "./scheduling.js";

test("uses the configured timezone for the current date", () => {
  const instant = new Date("2026-07-20T18:00:00.000Z");
  assert.equal(zonedDateKey(instant, "Asia/Jakarta"), "2026-07-21");
  assert.equal(zonedDateKey(instant, "America/New_York"), "2026-07-20");
});

test("calculates deadline distance using calendar days", () => {
  assert.equal(daysBetween("2026-07-21", "2026-07-24"), 3);
  assert.equal(daysBetween("2026-07-21", "2026-07-19"), -2);
});
