import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDelimited } from "../lib/live";

test("parseDelimited keeps quoted tabs, commas and newlines in one field", () => {
  const tsv = 'S/N\t中心名稱\t備註\n1\t"明愛\n觀塘中心"\t"a\tb"\n2\t第二名\t-\n';
  const rows = parseDelimited(tsv);
  assert.equal(rows.length, 3);
  assert.equal(rows[1][1], "明愛\n觀塘中心");
  assert.equal(rows[1][2], "a\tb");
  assert.equal(rows[2][1], "第二名");
});

test("parseDelimited handles doubled quotes and skips blank rows", () => {
  const rows = parseDelimited('a\t"say ""hi"""\n\n\nb\tc\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0][1], 'say "hi"');
  assert.deepEqual(rows[1], ["b", "c"]);
});
