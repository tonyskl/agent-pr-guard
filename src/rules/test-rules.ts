import type { Finding } from "../domain/inspection.js";
import type { GitComparison } from "../git/comparison.js";
import { findAddedJavaScriptTestCalls } from "./javascript-test-calls.js";

export interface RuleEvaluation {
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly string[];
}

export const evaluateTestRules = async (
  comparison: GitComparison,
  cwd?: string,
): Promise<RuleEvaluation> => {
  const { matches, skippedFiles } = await findAddedJavaScriptTestCalls(
    comparison,
    cwd,
  );
  const findings = matches.map((match) => {
    const focused = match.kind === "only";
    return {
      ruleId: (focused ? "APG1001" : "APG1002") as Finding["ruleId"],
      severity: "high" as const,
      title: focused ? "Focused test introduced" : "Skipped test introduced",
      explanation: focused
        ? "Focused tests may prevent the complete test suite from running."
        : "The test or suite will not execute normally.",
      location: {
        file: match.addedLine.file.path,
        line: match.addedLine.line,
        column: match.column,
      },
      evidence: match.evidence,
      remediation: focused
        ? "Remove `.only` before merging."
        : "Restore the test or document and explicitly suppress this rule in a future configuration mechanism.",
    };
  });
  findings.sort(
    (left, right) =>
      left.location.file.localeCompare(right.location.file) ||
      (left.location.line ?? 0) - (right.location.line ?? 0) ||
      left.ruleId.localeCompare(right.ruleId),
  );
  return {
    findings,
    diagnostics: skippedFiles.map(
      (path) => `Skipped unsafe analysis of ${path}.`,
    ),
  };
};
