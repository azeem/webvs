# 11: oxlint

**What to build:** Linting runs on oxlint instead of tslint, without turning the change into a refactor. See the spec's "PR 8: oxlint".

**Blocked by:** 10 (pnpm)

**Status:** resolved

- [x] oxlint with default rules plus the TypeScript plugin replaces tslint. tslint and its config removed
- [x] Small mechanical findings fixed
- [x] Rules that would need real code changes are turned off in config, each with a one-line comment giving the reason
- [x] No formatter added
- [x] Lint, unit, func 60/60 and the smoke check pass. CI green

## Comments

**Agent, 2026-11-01:** Folded into 09: TS 7 broke tslint, see the comment there. All checklist items are covered by that change.
