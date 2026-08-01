# Agent PR Guard

Agent PR Guard is a deterministic, local-first CLI and CI tool for identifying risky changes introduced by a pull request. It will focus on modifications affecting tests, CI workflows, dependencies, suppressions, and error handling.

## Status

This is an early project foundation. The command-line interface and domain model exist, but pull request analysis and detection rules have not yet been implemented.

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

`inspect` currently reports that analysis is not yet implemented; it does not inspect your repository.

## Development

Requirements: Node.js 24 or later and pnpm 11 or later.

```text
pnpm install
pnpm dev -- inspect --help
pnpm build
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
pnpm test
pnpm test:unit
pnpm test:integration
pnpm check
```

## Proposed exit codes

| Code | Meaning                                                                        |
| ---- | ------------------------------------------------------------------------------ |
| 0    | Analysis completed with no findings at the configured failure threshold.       |
| 1    | Analysis completed with findings at or above the configured failure threshold. |
| 2    | Invalid command usage, configuration, or an operational error.                 |

These semantics are proposed and may change before the first stable release.

## Roadmap

1. Safe Git diff acquisition and configuration loading.
2. Deterministic rule interfaces and the first rule families.
3. Human and stable JSON reporting.
4. CI integration guidance after third-party action pinning is defined.

## License

[MIT](LICENSE)
