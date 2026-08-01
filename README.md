# Agent PR Guard

Agent PR Guard is a deterministic, local-first CLI and CI tool for identifying risky changes introduced by a pull request. It will focus on modifications affecting tests, CI workflows, dependencies, suppressions, and error handling.

## Status

The first inspection rules are available for local Git comparisons. GitHub-hosted pull request integration is not implemented.

## Why it exists

Code review is often most effective when attention is directed toward a small set of high-impact changes. Agent PR Guard is intended to inspect the change set between Git references, rather than report pre-existing debt across an entire repository.

## Principles

- Deterministic: the same diff and configuration should produce the same findings.
- Local-first: core analysis will not require network services, telemetry, or an LLM.
- Evidence-oriented: findings should point to precise changed files and lines whenever possible.

## Non-goals

- Identifying whether code was written by AI.
- Replacing CodeQL, Snyk, Semgrep, SonarQube, or dependency scanners.
- General-purpose static analysis of an entire repository.
- Using an LLM to decide whether a pull request is safe.

## Planned rule families

- Tests weakened, removed, skipped, or suppressed.
- CI workflow and permission changes.
- Dependency and lockfile changes.
- New or expanded suppression mechanisms.
- Error handling that hides failures.

## Future CLI usage

```text
agent-pr-guard inspect --base main --head HEAD
agent-pr-guard inspect --base origin/main --format json --config .agent-pr-guard.json
```

`inspect` compares `base...head` using local Git references and evaluates only newly added lines. Both references must already exist locally; Agent PR Guard never fetches references.

## Supported rules

| Rule    | Severity | Detects                                                                                     |
| ------- | -------- | ------------------------------------------------------------------------------------------- |
| APG1001 | High     | Newly added `test.only`, `it.only`, `describe.only`, `suite.only`, or `context.only` calls. |
| APG1002 | High     | Newly added `test.skip`, `it.skip`, `describe.skip`, `suite.skip`, or `context.skip` calls. |

JavaScript and TypeScript files with `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, and `.cts` extensions are supported. The scanner deliberately ignores comments, strings, template text, and regular-expression literals; it is conservative rather than a complete JavaScript parser.

## Development

Requirements: Node.js 24 or later and pnpm 11 or later.

```text
pnpm install
pnpm dev -- --help
pnpm build
pnpm cli -- --help
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
pnpm test
pnpm test:unit
pnpm test:integration
pnpm smoke:cli
pnpm test:package
pnpm check
```

`pnpm cli` runs the compiled entry point at `dist/cli/index.js`. `pnpm smoke:cli`
builds and exercises that entry point directly. `pnpm test:package` packs the
package, installs the resulting tarball into an isolated temporary consumer, and
verifies the installed `agent-pr-guard` binary without publishing it.

## Proposed exit codes

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| 0    | Inspection completed with no high or critical findings.        |
| 1    | Inspection completed with high or critical findings.           |
| 2    | Invalid command usage, configuration, or an operational error. |

These semantics are proposed and may change before the first stable release.

## Roadmap

1. Safe Git diff acquisition and configuration loading.
2. Deterministic rule interfaces and the first rule families.
3. Human and stable JSON reporting.
4. CI integration guidance after third-party action pinning is defined.

## License

[MIT](LICENSE)
