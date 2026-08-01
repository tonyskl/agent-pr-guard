import { describe, expect, it } from "vitest";

import {
  ruleId,
  severities,
  type Finding,
} from "../../../src/domain/inspection.js";

describe("inspection domain", () => {
  it("exposes the supported severity values", () => {
    expect(severities).toEqual(["info", "low", "medium", "high", "critical"]);
  });

  it("represents a finding with optional evidence and remediation", () => {
    const finding: Finding = {
      ruleId: ruleId("APG-001"),
      severity: "high",
      title: "Workflow permission changed",
      explanation: "A CI workflow permission was expanded.",
      location: { file: ".github/workflows/ci.yml", line: 12, column: 3 },
      evidence: "contents: write",
      remediation: "Use the least-privileged permission.",
    };

    expect(finding.location.line).toBe(12);
    expect(finding.ruleId).toBe("APG-001");
  });
});
