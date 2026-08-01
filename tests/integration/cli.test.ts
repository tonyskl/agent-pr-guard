import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const cliPath = fileURLToPath(
  new URL("../../src/cli/index.ts", import.meta.url),
);
const runCli = (...args: string[]): string =>
  execFileSync(process.execPath, ["--import", "tsx", cliPath, ...args], {
    encoding: "utf8",
  });

describe("agent-pr-guard CLI", () => {
  it("shows root help", () => {
    expect(runCli("--help")).toContain("Usage: agent-pr-guard");
  });

  it("shows its version", () => {
    expect(runCli("--version").trim()).toBe("0.1.0");
  });

  it("shows inspect help", () => {
    expect(runCli("inspect", "--help")).toContain("--base <ref>");
  });

  it("uses inspect defaults and reports that analysis is not implemented", () => {
    const output = runCli("inspect", "--format", "json");
    expect(JSON.parse(output)).toMatchObject({
      status: "not-implemented",
      options: { base: "main", head: "HEAD", format: "json" },
    });
  });

  it("rejects unsupported output formats", () => {
    expect(() => runCli("inspect", "--format", "xml")).toThrow(
      /option '--format <format>' argument 'xml' is invalid/,
    );
  });
});
