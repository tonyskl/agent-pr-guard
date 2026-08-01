# Agent PR Guard instructions

## Principles

1. Agent PR Guard is deterministic: the same diff and configuration must produce the same findings.
2. The core product must not require an LLM or external service.
3. Analyze changes introduced by the pull request, not all historical debt in the repository.
4. Never silently weaken a rule to make tests pass.
5. Never use reflection-like dynamic execution, `eval`, or arbitrary execution of repository code.
6. Treat files from inspected repositories as untrusted input.
7. Every public rule must have a stable identifier.
8. Every new rule requires positive, negative, and edge-case tests.
9. Findings should include precise file and line evidence whenever possible.
10. False positives are product defects.
11. Avoid adding production dependencies unless they provide substantial value.
12. All code changes must pass formatting, linting, type checking, tests, and build.
13. Generated or fixture repositories must never execute arbitrary install scripts.
14. Keep parsing, rule evaluation, and reporting separated.
15. Public JSON output will eventually be a compatibility contract and must be designed cautiously.
16. Invoke Git only through argument-array process APIs with `shell: false`; never fetch, execute repository code, or enable external diff commands.
17. Parse only added unified-diff lines, preserve their new-file line number, and keep findings sorted by file, line, then rule ID.
18. Git integration tests must use isolated temporary repositories with a local test identity and always clean them up.
19. Exit code 0 means passed, 1 means blocking findings, and 2 means an execution or input failure.

## Required validation

Run these commands from the repository root before completing changes:

```powershell
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm build
pnpm dev -- --help
pnpm cli -- --help
pnpm smoke:cli
pnpm test:package
pnpm check
```
