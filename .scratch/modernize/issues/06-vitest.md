# 06: vitest for unit and func tests

**What to build:** Unit and func tests run on vitest. The WebGL pixel tests run in browser mode on headless Playwright Chromium with SwiftShader, the old karma / mocha-webpack stack is gone, and development moves to a current Node. See the spec's "PR 5: vitest".

**Blocked by:** 03 (Replace lodash-es), 04 (Minimal emitter and pinned stats.js), to keep the code-first order

**Status:** ready-for-agent

- [ ] Unit tests run under vitest with `vi.fn` / `vi.mock`. typemoq, ts-mockito, inject-loader, chai and mocha-webpack removed
- [ ] Func tests run in vitest browser mode on Playwright Chromium, headless, with the SwiftShader flags. Reference PNGs and resources served as static files. Test discovery uses vitest globs, not the webpack context index
- [ ] `testTimeout` 10s
- [ ] Func 60/60 with thresholds and reference PNGs unchanged. Any change needs a written reason in the PR
- [ ] karma and its plugins removed
- [ ] Dev on Node ≥22. CI runs lint, unit and func on Node 22 and 24, and passes
