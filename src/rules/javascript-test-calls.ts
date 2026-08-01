import { parse } from "@babel/parser";

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
const roots = new Set(["test", "it", "describe", "suite", "context"]);
const extensionOf = (path: string) => path.slice(path.lastIndexOf("."));

export interface TestCallMatch {
  readonly addedLine: AddedLine;
  readonly kind: "only" | "skip";
  readonly column: number;
  readonly evidence: string;
}

const walk = (
  value: unknown,
  visit: (node: Record<string, unknown>) => void,
): void => {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item) => walk(item, visit));
  const node = value as Record<string, unknown>;
  if (typeof node.type === "string") visit(node);
  for (const [key, child] of Object.entries(node)) {
    if (key !== "loc" && key !== "start" && key !== "end" && key !== "extra")
      walk(child, visit);
  }
};

const callModifier = (
  callee: Record<string, unknown>,
): { kind: "only" | "skip"; line: number; column: number } | undefined => {
  const chain: Record<string, unknown>[] = [];
  let current: Record<string, unknown> | undefined = callee;
  while (current?.type === "MemberExpression" && current.computed !== true) {
    const property = current.property as Record<string, unknown>;
    if (property.type !== "Identifier") return undefined;
    chain.unshift(property);
    current = current.object as Record<string, unknown>;
  }
  if (current?.type !== "Identifier" || !roots.has(String(current.name)))
    return undefined;
  const modifier = chain.find(
    (part) => part.name === "only" || part.name === "skip",
  );
  const loc = modifier?.loc as
    { start?: { line?: number; column?: number } } | undefined;
  if (!modifier || !loc?.start?.line || loc.start.column === undefined)
    return undefined;
  return {
    kind: modifier.name as "only" | "skip",
    line: loc.start.line,
    column: loc.start.column + 1,
  };
};

export const findAddedJavaScriptTestCalls = async (
  comparison: GitComparison,
  cwd = process.cwd(),
): Promise<{
  readonly matches: readonly TestCallMatch[];
  readonly skippedFiles: readonly string[];
}> => {
  const addedByFile = new Map<string, AddedLine[]>();
  for (const line of comparison.addedLines) {
    if (supportedExtensions.has(extensionOf(line.file.path)))
      addedByFile.set(line.file.path, [
        ...(addedByFile.get(line.file.path) ?? []),
        line,
      ]);
  }
  const matches: TestCallMatch[] = [];
  const skippedFiles: string[] = [];
  for (const [path, addedLines] of addedByFile) {
    try {
      const source = await readFileAtCommit(comparison.headCommit, path, cwd);
      const added = new Map(addedLines.map((line) => [line.line, line]));
      const ast = parse(source, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"],
      });
      walk(ast, (node) => {
        if (node.type !== "CallExpression") return;
        const modifier = callModifier(node.callee as Record<string, unknown>);
        const addedLine = modifier && added.get(modifier.line);
        if (modifier && addedLine)
          matches.push({
            addedLine,
            kind: modifier.kind,
            column: modifier.column,
            evidence: `${String((node.callee as { type?: string }).type ?? "call")}`,
          });
      });
    } catch {
      skippedFiles.push(path);
    }
  }
  return { matches, skippedFiles };
};
