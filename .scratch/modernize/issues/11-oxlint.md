# 11: oxlint

**What to build:** Linting runs on oxlint instead of tslint, without turning the change into a refactor. See the spec's "PR 8: oxlint".

**Blocked by:** 10 (pnpm)

**Status:** ready-for-agent

- [ ] oxlint with default rules plus the TypeScript plugin replaces tslint. tslint and its config removed
- [ ] Small mechanical findings fixed
- [ ] Rules that would need real code changes are turned off in config, each with a one-line comment giving the reason
- [ ] No formatter added
- [ ] Lint, unit, func 60/60 and the smoke check pass. CI green
