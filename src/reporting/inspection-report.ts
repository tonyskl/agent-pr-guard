import type { OutputFormat } from "../config/inspection-options.js";
import type { InspectionReport } from "../engine/inspect.js";

export const formatInspectionReport = (
  report: InspectionReport,
  format: OutputFormat,
): string => {
  if (format === "json") return `${JSON.stringify(report)}\n`;
  const lines = [
    "Agent PR Guard",
    "",
    `Comparison: ${report.comparison.base}...${report.comparison.head}`,
    `Files inspected: ${report.filesInspected}`,
    `Added lines inspected: ${report.addedLinesInspected}`,
    `Findings: ${report.findings.length}`,
  ];
  for (const finding of report.findings) {
    lines.push(
      "",
      `${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.location.file}:${finding.location.line ?? 0}`,
    );
    lines.push(
      `  ${finding.title}`,
      `  ${finding.explanation}`,
      `  ${finding.remediation ?? ""}`,
    );
  }
  lines.push("", `Result: ${report.status === "failed" ? "FAILED" : "PASSED"}`);
  return `${lines.join("\n")}\n`;
};

export const formatInspectionError = (
  message: string,
  format: OutputFormat,
): string =>
  format === "json"
    ? `${JSON.stringify({ schemaVersion: "1.0", error: { message } })}\n`
    : `Error: ${message}\n`;
