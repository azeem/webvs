# 01: Baseline: green from a clean checkout, CI on GitHub Actions

**What to build:** A clean clone of `master` installs with one command and passes lint, unit and func tests on the existing webpack 3 / karma toolchain, and GitHub Actions checks every PR. See the spec's "PR 1: Baseline" and the Phase 0 baseline under Testing Decisions.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] Lockfile regenerated so a fresh install succeeds without `--no-package-lock`. Dependencies pinned where Phase 0 found drift: early-2018 @types set, pegjs-loader 0.5.4, tslint 5.9.1
- [x] Func tests default to a headless Chrome launcher with the SwiftShader flags and get WebGL
- [x] Mocha timeout for func tests is 10s
- [x] Locally from a clean clone: lint passes, unit 6/6, func 60/60. Thresholds and reference PNGs unchanged
- [ ] A GitHub Actions workflow runs lint, unit and func on Node 16 with Chrome and passes on the PR
- [x] CircleCI config deleted
- [x] Hand-written `gitHead` removed from package metadata

## Comments

**Agent, 2026-11-01:** Implemented; only the CI checkbox is open, it needs a push and a green PR run.

- Transitive @types pins (node, lodash, glob, normalize-package-data) are done via npm `overrides`.
- Added `browserNoActivityTimeout: 60000` in karma.conf.js: karma's 10s default killed the browser during the slow DynamicMovement cases. Not in the spec.
- Local func: 60/60 on 2 of 3 runs. The failing run was DynamicMovement hitting its own `this.timeout(10000)` at load average ~30 on 10 cores.
- CI risks: headless Chrome on ubuntu-24.04 may need `--no-sandbox`; DynamicMovement (500 frames on SwiftShader) may be slow on the runner.
- Convolution.test.ts sets `this.timeout(5000)`, which overrides the new 10s default. Left unchanged.
