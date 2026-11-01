# 12: Compile the expression grammar at build time

**What to build:** The expression grammar is imported directly and compiled by a small inline peggy plugin that the build, the tests and the dev server all share. They always use the current grammar, and there's no separate regeneration step. This replaces ticket 05's committed parser; the spec has been amended to match.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Grammar compiled at build time by an inline plugin, with no new dependency. rollup-plugin-peggy was rejected: it only has a default export, has a rollup peer dependency, and hasn't been verified under rolldown
- [x] The parser still exposes a named `parse` export, typed by a short ambient module declaration
- [x] The committed generated parser and its types, the `gen:grammar` script and the oxlint ignore for the generated file are removed
- [x] Build output (ESM + CJS + types) still contains the parser
- [ ] Lint, unit, func and the smoke check pass, the dev server examples run, CI green

## Comments

**Agent, 2026-11-01:** Plugin lives in `peggy.plugin.ts` (a `load` hook returning `moduleType: "js"`), registered in `tsdown.config.ts` and `vitest.config.mts`. tsdown loads its config through Node's native import, so the plugin is imported with an explicit `.ts` extension, which needs `allowImportingTsExtensions` in tsconfig. Lint, unit 9/9, func 60/60, build and smoke pass locally, and the dev server serves the compiled grammar. CI pending.
