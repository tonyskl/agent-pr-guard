import type { InspectionOptions } from "../config/inspection-options.js";
import type { Finding } from "../domain/inspection.js";
import { GitComparisonError } from "../git/comparison.js";
import { readGitComparison } from "../git/reader.js";
import { evaluateTestRules } from "../rules/test-rules.js";

export interface InspectionReport {
  readonly schemaVersion: "1.0";
  readonly toolVersion: "0.1.0";
  readonly comparison: { readonly base: string; readonly head: string };
  readonly filesInspected: number;
  readonly addedLinesInspected: number;
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly string[];
  readonly status: "passed" | "failed";
}

export const inspectPullRequest = (
  options: InspectionOptions,
  cwd = process.cwd(),
): Promise<InspectionReport> => {
  if (options.config) {
    return Promise.reject(
      new GitComparisonError(
        "comparison-failed",
        "Configuration files are not implemented yet.",
      ),
    );
  }
  return readGitComparison(options.base, options.head, cwd).then(
    async (comparison) => {
      const evaluation = await evaluateTestRules(comparison, cwd);
      return {
        schemaVersion: "1.0",
        toolVersion: "0.1.0",
        comparison: { base: comparison.base, head: comparison.head },
        filesInspected: comparison.files.filter(
          (file) => file.status !== "deleted",
        ).length,
        addedLinesInspected: comparison.addedLines.length,
        findings: evaluation.findings,
        diagnostics: evaluation.diagnostics,
        status: evaluation.findings.some(
          (finding) =>
            finding.severity === "high" || finding.severity === "critical",
        )
          ? "failed"
          : "passed",
      };
    },
  );
};
