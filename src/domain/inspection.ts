export const severities = [
  "info",
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type Severity = (typeof severities)[number];

export type RuleId = string & { readonly __brand: "RuleId" };

export const ruleId = (value: string): RuleId => value as RuleId;

export interface SourceLocation {
  readonly file: string;
  readonly line?: number;
  readonly column?: number;
}

export interface Finding {
  readonly ruleId: RuleId;
  readonly severity: Severity;
  readonly title: string;
  readonly explanation: string;
  readonly location: SourceLocation;
  readonly evidence?: string;
  readonly remediation?: string;
}

export interface InspectionResult {
  readonly findings: readonly Finding[];
}
