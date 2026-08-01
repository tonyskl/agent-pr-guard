import type { ChangedFile, GitComparison } from "./comparison.js";
import { GitComparisonError } from "./comparison.js";
import { runGit } from "./process.js";
import { parseUnifiedDiff } from "./unified-diff.js";

const parseNameStatus = (output: Buffer): readonly ChangedFile[] => {
  const values = output.toString("utf8").split("\0");
  const files: ChangedFile[] = [];

  for (let index = 0; index < values.length - 1;) {
    const status = values[index++];
    if (!status) continue;
    const code = status[0];
    if (code === "R") {
      const previousPath = values[index++];
      const path = values[index++];
      if (!previousPath || !path) throw new Error("Malformed rename status.");
      files.push({ path, previousPath, status: "renamed" });
    } else {
      const path = values[index++];
      if (!path) throw new Error("Malformed file status.");
      const mapped =
        code === "A" ? "added" : code === "D" ? "deleted" : "modified";
      files.push({ path, status: mapped });
    }
  }
  return files;
};

const resolveCommit = async (
  ref: string,
  kind: "base" | "head",
  cwd: string,
): Promise<string> => {
  try {
    return (await runGit(["rev-parse", "--verify", `${ref}^{commit}`], cwd))
      .toString("utf8")
      .trim();
  } catch {
    throw new GitComparisonError(
      kind === "base" ? "base-not-found" : "head-not-found",
      `${kind === "base" ? "Base" : "Head"} reference cannot be resolved to a commit: ${ref}`,
    );
  }
};

export const readGitComparison = async (
  base: string,
  head: string,
  cwd = process.cwd(),
): Promise<GitComparison> => {
  try {
    const insideRepository = (
      await runGit(["rev-parse", "--is-inside-work-tree"], cwd)
    )
      .toString("utf8")
      .trim();
    if (insideRepository !== "true") throw new Error();
  } catch {
    throw new GitComparisonError(
      "not-a-repository",
      "Current directory is not a Git repository.",
    );
  }

  const baseCommit = await resolveCommit(base, "base", cwd);
  const headCommit = await resolveCommit(head, "head", cwd);
  const range = `${baseCommit}...${headCommit}`;
  let files: readonly ChangedFile[];
  try {
    files = parseNameStatus(
      await runGit(
        ["diff", "--name-status", "-z", "--find-renames", range],
        cwd,
      ),
    );
  } catch (error) {
    if (error instanceof GitComparisonError) throw error;
    throw new GitComparisonError(
      "comparison-failed",
      "Unable to read changed files.",
    );
  }

  const addedLines = [];
  for (const file of files) {
    if (file.status === "deleted") continue;
    try {
      const patch = await runGit(
        [
          "diff",
          "--no-color",
          "--no-ext-diff",
          "--no-textconv",
          "--find-renames",
          "--unified=0",
          range,
          "--",
          ...(file.previousPath ? [file.previousPath] : []),
          file.path,
        ],
        cwd,
      );
      addedLines.push(...parseUnifiedDiff(patch.toString("utf8"), file));
    } catch (error) {
      if (error instanceof GitComparisonError) throw error;
      throw new GitComparisonError(
        "comparison-failed",
        `Unable to read diff for ${file.path}.`,
      );
    }
  }

  return { base, head, headCommit, files, addedLines };
};

export const readFileAtCommit = async (
  commit: string,
  path: string,
  cwd = process.cwd(),
): Promise<string> =>
  (await runGit(["show", "--no-textconv", `${commit}:${path}`], cwd)).toString(
    "utf8",
  );
