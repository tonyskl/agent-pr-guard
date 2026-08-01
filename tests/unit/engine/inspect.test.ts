import { describe, expect, it } from "vitest";

import { inspectPullRequest } from "../../../src/engine/inspect.js";

describe("inspectPullRequest", () => {
  it("returns an explicit not-implemented result without analysis", () => {
    const result = inspectPullRequest({
      base: "main",
      head: "HEAD",
      format: "human",
    });

    expect(result).toMatchObject({
      status: "not-implemented",
      message: "Pull request analysis has not yet been implemented.",
      options: { base: "main", head: "HEAD" },
    });
  });
});
