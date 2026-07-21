import assert from "node:assert/strict";
import test from "node:test";
import { certificationState, normalizeName, parseDate } from "./domain.js";

test("normalizes skill names for case-insensitive uniqueness", () => {
  assert.equal(normalizeName("  Data   Visualization "), "data visualization");
});

test("treats dates as calendar dates rather than local instants", () => {
  assert.equal(parseDate("2026-07-21")?.toISOString(), "2026-07-21T00:00:00.000Z");
});

test("locks certification until at least one active resource is complete", () => {
  const certification = { completedAt: null } as never;
  assert.equal(certificationState(certification, []), "LOCKED");
  assert.equal(certificationState(certification, [{ status: "PLANNED", archivedAt: null }] as never), "LOCKED");
  assert.equal(certificationState(certification, [{ status: "COMPLETED", archivedAt: null }] as never), "READY");
});
