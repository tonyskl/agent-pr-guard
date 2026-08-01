import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const cliPath = fileURLToPath(
  new URL("../../src/cli/index.ts", import.meta.url),
);
const runCli = (...args: string[]) =>
  spawnSync(process.execPath, ["--import", "tsx", cliPath, ...args], {
    encoding: "utf8",
  });

const expectSuccess = (result: ReturnType<typeof runCli>): string => {
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  return result.stdout;
};

describe("agent-pr-guard CLI", () => {
  it("shows root help", () => {
    expect(expectSuccess(runCli("--help"))).toContain("Usage: agent-pr-guard");
  });

  it("shows its version", () => {
    expect(expectSuccess(runCli("--version")).trim()).toBe("0.1.0");
  });

  it("shows inspect help", () => {
    expect(expectSuccess(runCli("inspect", "--help"))).toContain(
      "--base <ref>",
    );
  });

  it("uses inspect defaults and returns the versioned inspection result", () => {
    const output = expectSuccess(runCli("inspect", "--format", "json"));
    expect(JSON.parse(output)).toMatchObject({
      schemaVersion: "1.0",
      comparison: { base: "main", head: "HEAD" },
      status: "passed",
      findings: [],
    });
  });

  it("rejects unsupported output formats", () => {
    const result = runCli("inspect", "--format", "xml");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "option '--format <format>' argument 'xml' is invalid",
    );
  });
});
