import type { OutputFormat } from "../config/inspection-options.js";
import type { InspectionNotImplemented } from "../engine/inspect.js";

export const formatNotImplementedResult = (
  result: InspectionNotImplemented,
  format: OutputFormat,
): string =>
  format === "json" ? `${JSON.stringify(result)}\n` : `${result.message}\n`;
