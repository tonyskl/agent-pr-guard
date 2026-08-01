import type { AddedLine, GitComparison } from "../git/comparison.js";
import { readFileAtCommit } from "../git/reader.js";

const supportedExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
]);

const extensionOf = (path: string): string => path.slice(path.lastIndexOf("."));

const executableCode = (source: string): readonly string[] => {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let state: "code" | "single" | "double" | "template" | "block" | "regex" =
    "code";
  let escaped = false;
  return lines.map((line) => {
    let output = "";
    let previousCode = "";
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index] ?? "";
      const next = line[index + 1] ?? "";
      if (state === "block") {
        output += " ";
        if (character === "*" && next === "/") {
          output += " ";
          index += 1;
          state = "code";
        }
        continue;
      }
      if (
        state === "single" ||
        state === "double" ||
        state === "template" ||
        state === "regex"
      ) {
        output += " ";
        if (
          !escaped &&
          ((state === "single" && character === "'") ||
            (state === "double" && character === '"') ||
            (state === "template" && character === "`") ||
            (state === "regex" && character === "/"))
        )
          state = "code";
        escaped = !escaped && character === "\\";
        if (character !== "\\") escaped = false;
        continue;
      }
      if (character === "/" && next === "/") {
        output += " ".repeat(line.length - index);
        break;
      }
      if (character === "/" && next === "*") {
        output += "  ";
        index += 1;
        state = "block";
        continue;
      }
      if (character === "'" || character === '"' || character === "`") {
        output += " ";
        state =
          character === "'"
            ? "single"
            : character === '"'
              ? "double"
              : "template";
        escaped = false;
        continue;
      }
      if (
        character === "/" &&
        (!previousCode || /[([{:;,=!?&|+\-*%^~<>]/.test(previousCode))
      ) {
        output += " ";
        state = "regex";
        escaped = false;
        continue;
      }
      output += character;
      if (!/\s/.test(character)) previousCode = character;
    }
    if (state === "single" || state === "double" || state === "regex")
      state = "code";
    return output;
  });
};

export interface TestCallMatch {
  readonly addedLine: AddedLine;
  readonly kind: "only" | "skip";
  readonly column: number;
  readonly evidence: string;
}

const callPattern =
  /\b(test|it|describe|suite|context)\s*\.\s*(only|skip)\b(?:\s*\.\s*[A-Za-z_$][\w$]*)*\s*\(/g;

export const findAddedJavaScriptTestCalls = async (
  comparison: GitComparison,
  cwd = process.cwd(),
): Promise<{
  readonly matches: readonly TestCallMatch[];
  readonly skippedFiles: readonly string[];
}> => {
  const addedByFile = new Map<string, AddedLine[]>();
  for (const addedLine of comparison.addedLines) {
    if (supportedExtensions.has(extensionOf(addedLine.file.path))) {
      const lines = addedByFile.get(addedLine.file.path) ?? [];
      lines.push(addedLine);
      addedByFile.set(addedLine.file.path, lines);
    }
  }
  const matches: TestCallMatch[] = [];
  const skippedFiles: string[] = [];
  for (const [path, addedLines] of addedByFile) {
    try {
      const code = executableCode(
        await readFileAtCommit(comparison.headCommit, path, cwd),
      );
      for (const addedLine of addedLines) {
        const line = code[addedLine.line - 1];
        if (line === undefined) continue;
        for (const match of line.matchAll(callPattern)) {
          const kind = match[2] as "only" | "skip";
          matches.push({
            addedLine,
            kind,
            column: (match.index ?? 0) + 1,
            evidence: match[0],
          });
        }
      }
    } catch {
      skippedFiles.push(path);
    }
  }
  return { matches, skippedFiles };
};
