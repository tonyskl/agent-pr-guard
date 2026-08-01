import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const tscPath = resolve(repositoryRoot, "node_modules/typescript/bin/tsc");
const cliPath = resolve(repositoryRoot, "dist/cli/index.js");

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
};

const expectCommand = (args, expectedOutput) => {
  const result = run(process.execPath, [cliPath, ...args]);
  if (result.status !== 0 || !expectedOutput.test(result.stdout)) {
    throw new Error(
      `Unexpected result for agent-pr-guard ${args.join(" ")}:\n${result.stderr}${result.stdout}`,
    );
  }
};

const build = run(process.execPath, [tscPath, "-p", "tsconfig.build.json"]);
if (build.status !== 0 || !existsSync(cliPath)) {
  throw new Error(`Build failed:\n${build.stderr}${build.stdout}`);
}

expectCommand(["--help"], /Usage: agent-pr-guard/);
expectCommand(["--version"], /^0\.1\.0\s*$/);
expectCommand(["inspect", "--help"], /--base <ref>/);
expectCommand(["inspect"], /Result: PASSED/);
expectCommand(
  ["inspect", "--base", "main", "--head", "HEAD", "--format", "json"],
  /"base":"main".*"head":"HEAD"/,
);
expectCommand(["inspect", "--format", "human"], /Result: PASSED/);
expectCommand(["inspect", "--format", "json"], /"schemaVersion":"1.0"/);

const invalidFormat = run(process.execPath, [
  cliPath,
  "inspect",
  "--format",
  "xml",
]);
if (
  invalidFormat.status === 0 ||
  !invalidFormat.stderr.includes(
    "option '--format <format>' argument 'xml' is invalid",
  )
) {
  throw new Error(
    `Invalid format was not rejected as expected:\n${invalidFormat.stderr}${invalidFormat.stdout}`,
  );
}

process.stdout.write("CLI smoke checks passed.\n");
