import { spawn } from "node:child_process";

import { GitComparisonError } from "./comparison.js";
import { MAXIMUM_PROCESS_STDERR_BYTES } from "./limits.js";

const maximumGitOutputBytes = 10 * 1024 * 1024;

export const runGit = async (
  args: readonly string[],
  cwd: string,
  maximumOutputBytes = maximumGitOutputBytes,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const process = spawn("git", args, {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output: Buffer[] = [];
    const errors: Buffer[] = [];
    let size = 0;
    let errorSize = 0;
    let exceededLimit = false;
    let settled = false;
    const settle = (callback: () => void) => {
      if (!settled) {
        settled = true;
        callback();
      }
    };

    const collect = (chunk: Buffer) => {
      size += chunk.length;
      if (size > maximumOutputBytes) {
        exceededLimit = true;
        process.kill();
        return;
      }
      output.push(chunk);
    };

    process.stdout.on("data", collect);
    process.stderr.on("data", (chunk: Buffer) => {
      errorSize += chunk.length;
      if (errorSize <= MAXIMUM_PROCESS_STDERR_BYTES) errors.push(chunk);
    });
    process.on("error", () =>
      settle(() =>
        reject(
          new GitComparisonError(
            "comparison-failed",
            "Unable to start the Git executable.",
          ),
        ),
      ),
    );
    process.on("close", (code) => {
      if (exceededLimit) {
        settle(() =>
          reject(
            new GitComparisonError(
              "diff-too-large",
              `Git output exceeds the ${maximumGitOutputBytes / 1024 / 1024} MiB safety limit.`,
            ),
          ),
        );
        return;
      }
      if (code !== 0) {
        const detail = Buffer.concat(errors).toString("utf8").trim();
        settle(() =>
          reject(
            new GitComparisonError(
              "comparison-failed",
              detail || "Git comparison failed.",
            ),
          ),
        );
        return;
      }
      settle(() => resolve(Buffer.concat(output)));
    });
  });
