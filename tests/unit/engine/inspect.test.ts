import { describe, expect, it } from "vitest";

import { inspectPullRequest } from "../../../src/engine/inspect.js";

describe("inspectPullRequest", () => {
  it("rejects configuration until configuration support exists", async () => {
    await expect(
      inspectPullRequest({
        base: "main",
        head: "HEAD",
        format: "human",
        config: "guard.json",
      }),
    ).rejects.toThrow("Configuration files are not implemented yet.");
  });
});
