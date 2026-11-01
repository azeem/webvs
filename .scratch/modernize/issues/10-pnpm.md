# 10: pnpm

**What to build:** The repo uses pnpm instead of npm, locally and in CI. Every dependency the code uses is declared explicitly.

**Blocked by:** 08 (Examples and README on the module build), 09 (TypeScript 7)

**Status:** ready-for-agent

- [x] pnpm lockfile replaces the npm lockfile. A `packageManager` field pins the pnpm version
- [x] Any undeclared dependency exposed by strict `node_modules` is added explicitly
- [ ] CI installs with pnpm and runs lint, unit, func and the smoke check, all passing
- [x] README and scripts don't refer to npm-specific commands for development
