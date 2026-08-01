import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { inspectPullRequest } from "../../src/engine/inspect.js";
import { readGitComparison } from "../../src/git/reader.js";

const repositories: string[] = [];
const git = (cwd: string, ...args: string[]): string =>
  execFileSync("git", args, { cwd, encoding: "utf8" });
const repository = (): string => {
  const cwd = mkdtempSync(join(tmpdir(), "agent-pr-guard-git-"));
  repositories.push(cwd);
  git(cwd, "init", "-b", "main");
  git(cwd, "config", "user.email", "test@example.com");
  git(cwd, "config", "user.name", "Agent PR Guard test");
  return cwd;
};
const commit = (cwd: string, message: string) => {
  git(cwd, "add", "--all");
  git(cwd, "commit", "-m", message);
};

afterEach(() => {
  while (repositories.length)
    rmSync(repositories.pop() ?? "", { recursive: true, force: true });
});

describe("Git-backed inspection", () => {
  it("detects focused and skipped calls only when introduced in head", async () => {
    const cwd = repository();
    writeFileSync(join(cwd, "example.test.ts"), "test('safe', () => {});\n");
    commit(cwd, "base");
    writeFileSync(
      join(cwd, "example.test.ts"),
      [
        "test('safe', () => {});",
        "test.only('focused', () => {});",
        "describe.skip('skipped', () => {});",
        "// it.only('comment')",
        "const text = 'test.skip()';",
      ].join("\n"),
    );
    commit(cwd, "head");

    const report = await inspectPullRequest(
      { base: "main~1", head: "HEAD", format: "json" },
      cwd,
    );
    expect(report.status).toBe("failed");
    expect(report.findings.map((finding) => finding.ruleId)).toEqual([
      "APG1001",
      "APG1002",
    ]);
    expect(report.findings.map((finding) => finding.location.line)).toEqual([
      2, 3,
    ]);
  });

  it("reads renamed paths and added lines while ignoring historical and deleted calls", async () => {
    const cwd = repository();
    writeFileSync(
      join(cwd, "old name.test.ts"),
      [
        "test('one', () => {});",
        "test('two', () => {});",
        "test.only('historical', () => {});",
      ].join("\n"),
    );
    commit(cwd, "base");
    git(cwd, "mv", "old name.test.ts", "new name.test.ts");
    writeFileSync(
      join(cwd, "new name.test.ts"),
      [
        "test('one', () => {});",
        "test('two', () => {});",
        "test('safe', () => {});",
      ].join("\n"),
    );
    commit(cwd, "head");

    const comparison = await readGitComparison("main~1", "HEAD", cwd);
    expect(comparison.files).toEqual([
      {
        path: "new name.test.ts",
        previousPath: "old name.test.ts",
        status: "renamed",
      },
    ]);
    expect(comparison.addedLines).toHaveLength(1);
    const report = await inspectPullRequest(
      { base: "main~1", head: "HEAD", format: "human" },
      cwd,
    );
    expect(report.findings).toEqual([]);
  });

  it("distinguishes invalid references and non-repositories", async () => {
    const cwd = repository();
    writeFileSync(join(cwd, "safe.ts"), "export {};\n");
    commit(cwd, "base");
    await expect(
      readGitComparison("missing", "HEAD", cwd),
    ).rejects.toMatchObject({ code: "base-not-found" });
    await expect(
      readGitComparison("HEAD", "missing", cwd),
    ).rejects.toMatchObject({ code: "head-not-found" });
    const notRepository = mkdtempSync(
      join(tmpdir(), "agent-pr-guard-not-git-"),
    );
    repositories.push(notRepository);
    await expect(
      readGitComparison("main", "HEAD", notRepository),
    ).rejects.toMatchObject({ code: "not-a-repository" });
  });
});
