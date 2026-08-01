import type { AddedLine, ChangedFile } from "./comparison.js";

export const parseUnifiedDiff = (
  patch: string,
  file: ChangedFile,
): readonly AddedLine[] => {
  const added: AddedLine[] = [];
  let newLine = 0;
  let inHunk = false;

  for (const line of patch.split("\n")) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      newLine = Number(hunk[1]);
      inHunk = true;
      continue;
    }
    if (!inHunk || line === "\\ No newline at end of file") {
      continue;
    }
    if (line.startsWith("+")) {
      added.push({ file, line: newLine, content: line.slice(1) });
      newLine += 1;
    } else if (line.startsWith("-")) {
      continue;
    } else if (line.startsWith(" ")) {
      newLine += 1;
    } else if (line.startsWith("@@") || line.startsWith("diff ")) {
      inHunk = false;
    }
  }

  return added;
};
