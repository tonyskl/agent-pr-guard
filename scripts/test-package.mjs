import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const artifactsDirectory = resolve(repositoryRoot, ".artifacts");
const pnpmCliPath = process.env.npm_execpath;

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
  });
  if (result.error) {
    throw result.error;
  }
  return result;
};

const runPnpm = (args, cwd) => {
  if (!pnpmCliPath) {
    throw new Error("test:package must be run through pnpm.");
  }

  return run(process.execPath, [pnpmCliPath, ...args], cwd);
};

const requireSuccess = (description, result) => {
  if (result.status !== 0) {
    throw new Error(`${description} failed:\n${result.stderr}${result.stdout}`);
  }
  return result;
};

const tarPaths = (tarballPath) => {
  const archive = gunzipSync(readFileSync(tarballPath));
  const paths = [];
  let offset = 0;

  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) {
      break;
    }

    const readString = (start, end) =>
      header.subarray(start, end).toString("utf8").replace(/\0.*$/, "");
    const name = readString(0, 100);
    const prefix = readString(345, 500);
    const size = Number.parseInt(readString(124, 136).trim(), 8) || 0;
    paths.push(prefix ? `${prefix}/${name}` : name);
    offset += 512 + Math.ceil(size / 512) * 512;
  }

  return paths;
};

mkdirSync(artifactsDirectory, { recursive: true });
const build = run(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "-p", "tsconfig.build.json"],
  repositoryRoot,
);
requireSuccess("Production build", build);

const packed = requireSuccess(
  "Package creation",
  runPnpm(["pack", "--pack-destination", artifactsDirectory], repositoryRoot),
);
const tarballName = packed.stdout.trim().split(/\r?\n/).at(-1);
if (!tarballName) {
  throw new Error("pnpm pack did not report a tarball name.");
}

const tarballPath = join(artifactsDirectory, basename(tarballName));
if (!existsSync(tarballPath)) {
  throw new Error(`Expected tarball was not created: ${tarballPath}`);
}

if (!tarPaths(tarballPath).includes("package/dist/cli/index.js")) {
  throw new Error(
    "Packed artifact does not include package/dist/cli/index.js.",
  );
}

const consumerDirectory = mkdtempSync(
  join(tmpdir(), "agent-pr-guard-package-consumer-"),
);
try {
  writeFileSync(
    join(consumerDirectory, "package.json"),
    JSON.stringify(
      { name: "agent-pr-guard-package-consumer", private: true },
      null,
      2,
    ),
  );

  requireSuccess(
    "Consumer installation",
    runPnpm(["install", "--ignore-scripts", tarballPath], consumerDirectory),
  );

  for (const [args, expectedOutput] of [
    [["agent-pr-guard", "--help"], /Usage: agent-pr-guard/],
    [["agent-pr-guard", "--version"], /^0\.1\.0\s*$/],
  ]) {
    const result = requireSuccess(
      `Installed CLI ${args.slice(1).join(" ")}`,
      runPnpm(["exec", ...args], consumerDirectory),
    );
    if (!expectedOutput.test(result.stdout)) {
      throw new Error(`Unexpected installed CLI output:\n${result.stdout}`);
    }
  }
  const inspect = runPnpm(
    ["exec", "agent-pr-guard", "inspect"],
    consumerDirectory,
  );
  if (
    inspect.status !== 2 ||
    !inspect.stderr.includes("not a Git repository")
  ) {
    throw new Error(
      `Unexpected installed inspect result:\n${inspect.stderr}${inspect.stdout}`,
    );
  }
} finally {
  rmSync(consumerDirectory, { recursive: true, force: true });
}

process.stdout.write(`Package verification passed: ${tarballPath}\n`);
