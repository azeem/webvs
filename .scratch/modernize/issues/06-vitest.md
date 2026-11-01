# 06: vitest for unit and func tests

**What to build:** Unit and func tests run on vitest. The WebGL pixel tests run in browser mode on headless Playwright Chromium with SwiftShader, the old karma / mocha-webpack stack is gone, and development moves to a current Node. See the spec's "PR 5: vitest".

**Blocked by:** 03 (Replace lodash-es), 04 (Minimal emitter and pinned stats.js), to keep the code-first order

**Status:** resolved

- [x] Unit tests run under vitest with `vi.fn` / `vi.mock`. typemoq, ts-mockito, inject-loader, chai and mocha-webpack removed
- [x] Func tests run in vitest browser mode on Playwright Chromium, headless, with the SwiftShader flags. Reference PNGs and resources served as static files. Test discovery uses vitest globs, not the webpack context index
- [x] `testTimeout` 10s
- [x] Func 60/60 with thresholds and reference PNGs unchanged. Any change needs a written reason in the PR
- [x] karma and its plugins removed
- [x] Dev on Node ≥22. CI runs lint, unit and func on Node 22 and 24, and passes

## Comments

**Agent, 2026-11-01:** Implemented. Local on Node 24.20.0: tsc 0 errors outside the stale, gitignored `dist/`, lint passes, unit 9/9, func 60/60. Thresholds and PNGs unchanged. vitest 5.0.5, @vitest/browser-playwright 5.0.5, playwright 1.64.1. Also needed beyond the spec: `@types/node` 22.20.5 replaces the Node 16 override (vitest's peer range), the config is `vitest.config.mts` because the package isn't ESM yet, mocha's `before`/`after` became `beforeAll`/`afterAll`, and the per-suite `this.timeout` calls were dropped in favour of the global 10s (Convolution goes from 5s to 10s). Unit mocks use a small Proxy `autoMock` in place of typemoq's dynamic mocks. webpack 3 still builds on Node 24 without the legacy OpenSSL flag. vitest 5 requires Node ≥22.12, which enforces "dev on Node ≥22" until ticket 07 adds `engines`. CI passed on Node 22 and 24 after the push.
