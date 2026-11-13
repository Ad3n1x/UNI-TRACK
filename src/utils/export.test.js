import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, convertTrackersToCSV } from "./export.js";

test("CSV cells escape quotes and wrap values", () => {
  assert.equal(csvCell('A "quoted" value'), '"A ""quoted"" value"');
});

test("CSV cells neutralise spreadsheet formulas", () => {
  assert.equal(csvCell("=HYPERLINK(\"https://example.com\")"), '"\'=HYPERLINK(""https://example.com"")"');
  assert.equal(csvCell("  @SUM(1,2)"), '"\'  @SUM(1,2)"');
  assert.equal(csvCell("-1+2"), '"\'-1+2"');
});

test("numeric negative values remain numeric rather than formula-prefixed", () => {
  assert.equal(csvCell(-12), '"-12"');
});

test("tracker export preserves entry values and uses CRLF records", () => {
  const csv = convertTrackersToCSV([{ _id: "t1", name: "Water", type: "counter", target: 3, entries: [{ id: "e1", date: "2026-11-13", value: -2, note: "daily" }] }]);
  assert.ok(csv.includes('"Water"'));
  assert.ok(csv.includes('"-2"'));
  assert.ok(csv.includes("\r\n"));
});
