import { Command, Option } from "commander";

import {
  inspectionOptionsSchema,
  outputFormats,
} from "../config/inspection-options.js";
import { inspectPullRequest } from "../engine/inspect.js";
import {
  formatInspectionError,
  formatInspectionReport,
} from "../reporting/inspection-report.js";

export const createProgram = (): Command => {
  const program = new Command();
  program
    .name("agent-pr-guard")
    .description("Deterministic, local-first pull request risk analysis.")
    .version("0.1.0");

  program
    .command("inspect")
    .description("Inspect pull request changes between two Git references.")
    .option("--base <ref>", "base Git reference", "main")
    .option("--head <ref>", "head Git reference", "HEAD")
    .addOption(
      new Option(
        "--format <format>",
        `output format (${outputFormats.join(", ")})`,
      )
        .choices([...outputFormats])
        .default("human"),
    )
    .option("--config <path>", "path to a configuration file")
    .action(async (rawOptions: unknown) => {
      const options = inspectionOptionsSchema.parse(rawOptions);
      try {
        const result = await inspectPullRequest(options);
        process.stdout.write(formatInspectionReport(result, options.format));
        process.exitCode = result.status === "failed" ? 1 : 0;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Inspection failed.";
        process.stderr.write(formatInspectionError(message, options.format));
        process.exitCode = 2;
      }
    });

  return program;
};
