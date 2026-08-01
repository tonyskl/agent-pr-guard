export type ChangeStatus = "added" | "modified" | "renamed" | "deleted";

export interface ChangedFile {
  readonly path: string;
  readonly status: ChangeStatus;
  readonly previousPath?: string;
}

export interface AddedLine {
  readonly file: ChangedFile;
  readonly line: number;
  readonly content: string;
}

export interface GitComparison {
  readonly base: string;
  readonly head: string;
  readonly files: readonly ChangedFile[];
  readonly addedLines: readonly AddedLine[];
}

export type GitComparisonErrorCode =
  | "not-a-repository"
  | "base-not-found"
  | "head-not-found"
  | "comparison-failed"
  | "diff-too-large";

export class GitComparisonError extends Error {
  public constructor(
    readonly code: GitComparisonErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GitComparisonError";
  }
}
