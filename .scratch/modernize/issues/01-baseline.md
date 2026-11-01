# 01: Baseline: green from a clean checkout, CI on GitHub Actions

**What to build:** A clean clone of `master` installs with one command and passes lint, unit and func tests on the existing webpack 3 / karma toolchain, and GitHub Actions checks every PR. See the spec's "PR 1: Baseline" and the Phase 0 baseline under Testing Decisions.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Lockfile regenerated so a fresh install succeeds without `--no-package-lock`. Dependencies pinned where Phase 0 found drift: early-2018 @types set, pegjs-loader 0.5.4, tslint 5.9.1
- [ ] Func tests default to a headless Chrome launcher with the SwiftShader flags and get WebGL
- [ ] Mocha timeout for func tests is 10s
- [ ] Locally from a clean clone: lint passes, unit 6/6, func 60/60. Thresholds and reference PNGs unchanged
- [ ] A GitHub Actions workflow runs lint, unit and func on Node 16 with Chrome and passes on the PR
- [ ] CircleCI config deleted
- [ ] Hand-written `gitHead` removed from package metadata
