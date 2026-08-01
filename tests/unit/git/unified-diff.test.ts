import { describe, expect, it } from "vitest";

import type { ChangedFile } from "../../../src/git/comparison.js";
import { parseUnifiedDiff } from "../../../src/git/unified-diff.js";

const modified: ChangedFile = {
  path: "tests/example.test.ts",
  status: "modified",
};

describe("parseUnifiedDiff", () => {
  it("reads added lines across multiple hunks with their new-file locations", () => {
    const patch = [
      "@@ -2 +2,2 @@",
      "+test.only('first', () => {});",
      "+const literal = '+';",
      "@@ -10 +12 @@",
      "+it.skip('second', () => {});",
      "",
    ].join("\n");

    expect(parseUnifiedDiff(patch, modified)).toEqual([
      { file: modified, line: 2, content: "test.only('first', () => {});" },
      { file: modified, line: 3, content: "const literal = '+';" },
      { file: modified, line: 12, content: "it.skip('second', () => {});" },
    ]);
  });

  it("handles added files, renames, deleted files, no-newline markers, and binary patches", () => {
    const added: ChangedFile = { path: "tests/new file.ts", status: "added" };
    const renamed: ChangedFile = {
      path: "tests/new name.ts",
      previousPath: "tests/old name.ts",
      status: "renamed",
    };
    expect(
      parseUnifiedDiff(
        "@@ -0,0 +1 @@\n++value\n\\ No newline at end of file\n",
        added,
      ),
    ).toEqual([{ file: added, line: 1, content: "+value" }]);
    expect(
      parseUnifiedDiff("@@ -1 +1 @@\n+test.only()\n", renamed)[0]?.file,
    ).toEqual(renamed);
    expect(
      parseUnifiedDiff("Binary files differ\n", {
        path: "image.png",
        status: "modified",
      }),
    ).toEqual([]);
    expect(parseUnifiedDiff("@@ malformed\n+unsafe\n", modified)).toEqual([]);
  });

  it("returns no added lines for empty and deletion-only diffs", () => {
    expect(parseUnifiedDiff("", modified)).toEqual([]);
    expect(parseUnifiedDiff("@@ -4 +0,0 @@\n-test.only()\n", modified)).toEqual(
      [],
    );
  });
});
