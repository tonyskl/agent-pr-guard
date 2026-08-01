import { Command, Option } from "commander";

import {
  inspectionOptionsSchema,
  outputFormats,
} from "../config/inspection-options.js";
import { inspectPullRequest } from "../engine/inspect.js";
import { formatNotImplementedResult } from "../reporting/not-implemented.js";

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
    .action((rawOptions: unknown) => {
      const options = inspectionOptionsSchema.parse(rawOptions);
      const result = inspectPullRequest(options);
      process.stdout.write(formatNotImplementedResult(result, options.format));
    });

  return program;
};
