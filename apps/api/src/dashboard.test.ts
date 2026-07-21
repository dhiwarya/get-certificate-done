import assert from "node:assert/strict";
import test from "node:test";
import { sortRanking } from "./metrics.js";

test("ranks by completion velocity, latest completion, then name", () => {
  const rows = [
    { name: "Rust", recentCompletions: 1, lastCompletionAt: new Date("2026-07-20") },
    { name: "Design", recentCompletions: 2, lastCompletionAt: new Date("2026-07-18") },
    { name: "TypeScript", recentCompletions: 1, lastCompletionAt: new Date("2026-07-21") }
  ];
  assert.deepEqual(sortRanking(rows).map((row) => row.name), ["Design", "TypeScript", "Rust"]);
});
