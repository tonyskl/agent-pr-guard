import type { InspectionOptions } from "../config/inspection-options.js";

export interface InspectionNotImplemented {
  readonly status: "not-implemented";
  readonly message: string;
  readonly options: InspectionOptions;
}

export const inspectPullRequest = (
  options: InspectionOptions,
): InspectionNotImplemented => ({
  status: "not-implemented",
  message: "Pull request analysis has not yet been implemented.",
  options,
});
