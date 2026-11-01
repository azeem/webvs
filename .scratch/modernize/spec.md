# Modernize webvs: native code first, then build, test and lint tooling

Status: ready-for-agent

## Problem Statement

webvs was last published as 3.0.0 in April 2018 and its toolchain is frozen there: webpack 3, TypeScript 2.7 with an es2015 lib, tslint, mocha-webpack and karma 2. A fresh checkout no longer installs or passes tests: the lockfile points at a git dependency that no longer exists, today's `@types/*` packages can't be parsed by the old compiler, pegjs-loader's latest release breaks webpack 3, and headless Chrome has no WebGL without extra flags. CI (CircleCI on a moving image) has left no record since 2018.

The library also ships three runtime dependencies it doesn't need (lodash-es, eventemitter3, and an unpinned stats.js) and a `window.Webvs` global build that no known consumer uses. As a maintainer, I can't make a change and trust the result, and consumers pull in more than they should.

## Solution

Modernize in eight small PRs into `master`, each one green on its own and checked by CI. The code changes come first, on the existing toolchain. The tooling is replaced afterwards, and linting comes last:

1. **Baseline:** make the existing toolchain install and pass from a clean checkout, and move CI to GitHub Actions.
2. **TypeScript 6** on the existing toolchain.
3. **Replace lodash-es** with native JavaScript.
4. **Replace eventemitter3** with a minimal in-house emitter, and pin stats.js.
5. **vitest** replaces karma and mocha-webpack, including browser mode for the WebGL pixel tests.
6. **tsdown + TypeScript 7 + peggy** replace webpack and pegjs. The output becomes ESM + CJS only. This is the 4.0.0 breaking change.
7. **pnpm** replaces npm.
8. **oxlint** replaces tslint.

At the end, 4.0.0 is ready to publish: no runtime dependencies besides stats.js, a modern build and test setup, and an unchanged public API apart from the removed global build.

## User Stories

1. As a maintainer, I want a clean checkout to install with one command, so that I can start working without reverse-engineering 2018 dependency pins.
2. As a maintainer, I want lint, unit and func tests to pass from a clean checkout on the baseline, so that every later change starts from a known-green state.
3. As a maintainer, I want the WebGL func tests to run headless on a software renderer (SwiftShader), so that they behave the same on my machine and on a GPU-less CI runner.
4. As a maintainer, I want func tests not to time out on first-run startup cost, so that a red run means a real regression.
5. As a maintainer, I want every PR checked by GitHub Actions (lint, unit, func), so that "green on its own" is verified rather than claimed.
6. As a maintainer, I want CircleCI removed, so that there's one CI system and no stale config.
7. As a maintainer, I want to write code against TypeScript 6 with an es2022 lib, so that native methods like `flatMap`, `Object.entries`, `includes` and `at` type-check.
8. As a maintainer, I want the TS upgrade to keep emitting output the existing bundler can parse, so that the upgrade doesn't drag a bundler swap in with it.
9. As a maintainer, I want the latent typing bug in the image-loading error callback fixed (its return value is used as a boolean but typed as void), so that the type matches the behaviour.
10. As a maintainer, I want the existing unit tests to keep passing under TypeScript 6's always-on module interop, so that the upgrade doesn't silently lose coverage.
11. As a library consumer, I want webvs not to depend on lodash-es, so that my bundle doesn't include it.
12. As a maintainer, I want lodash calls replaced by plain native equivalents rather than a home-grown utility layer, so that the code reads as ordinary modern JavaScript.
13. As a maintainer, I want the expression grammar's generated parser to stop requiring lodash too, so that the dependency is gone everywhere, not just in hand-written modules.
14. As a library consumer, I want webvs not to depend on eventemitter3, so that I ship one dependency fewer.
15. As a library consumer, I want `on`, `addListener`, `removeListener` and `emit` to keep the same names and signatures, so that code like `main.rsrcMan.on('ready', …)` keeps working without changes.
16. As a library consumer, I want stats.js pinned to a real version range instead of `*`, so that installs are reproducible.
17. As a maintainer, I want the test runner to be vitest, so that tests run on a current Node and no longer depend on webpack.
18. As a maintainer, I want the WebGL pixel tests to run in vitest browser mode on Playwright Chromium with SwiftShader, so that the same renderer is used locally and in CI.
19. As a maintainer, I want the func thresholds and reference PNGs frozen at their current values, so that the tooling migration can't quietly loosen what the tests check.
20. As a maintainer, I want any threshold change or regenerated PNG justified in writing in its PR, so that loosening is deliberate and reviewable.
21. As a maintainer, I want unit-test mocks written with vitest's own mocking, so that typemoq, ts-mockito and inject-loader can be removed.
22. As a maintainer, I want the dev environment on Node ≥22 once karma is gone, so that I'm not stuck on an end-of-life Node.
23. As a maintainer, I want the build done by tsdown with TypeScript 7, so that webpack, ts-loader and the old build scripts can be deleted.
24. As a library consumer, I want ESM and CJS builds with type declarations, so that both `import` and `require` work and my editor gets types.
25. As a library consumer, I want `import Webvs from 'webvs'` and `Webvs.Main`, `Webvs.WebAudioAnalyser` and friends to keep working, so that upgrading to 4.0.0 needs no code changes for npm users.
26. As a library consumer, I want named exports (`import { Main } from 'webvs'`), so that I can import only what I use.
27. As a CDN user, I want the README to show how to load webvs as an ES module from unpkg, so that I have a replacement for the removed `<script>` global.
28. As a library consumer, I want the default resource pack URL to still point at the matching published version on unpkg, so that presets that use bundled resources keep loading.
29. As a library consumer, I want the published package to contain only the build output and the resources, so that installs are small and contain nothing stale.
30. As a library consumer, I want the package to declare the Node versions it supports (≥22), so that tooling can warn me early.
31. As a maintainer, I want the expression grammar compiled at build time by one plugin shared by build, test and dev server, so that the parser can't go stale and there's no regeneration script to remember.
32. As a maintainer, I want the examples page to run against the source through a dev server, so that I can try changes without building first.
33. As a maintainer, I want the unused typedoc setup removed, so that I don't maintain a docs build nobody publishes.
34. As a maintainer, I want misleading leftovers removed (a hand-written `gitHead`, `readmeFilename`, `.npmignore`, cross-env, shx, npm-run-all, webpack-serve), so that package metadata reflects reality.
35. As a maintainer, I want to use pnpm, so that installs are faster and stricter about undeclared dependencies.
36. As a maintainer, I want oxlint instead of tslint, so that linting runs on a maintained tool.
37. As a maintainer, I want oxlint to start from its defaults, with small findings fixed and noisy rules turned off with a short reason, so that the lint PR doesn't turn into a refactor.
38. As a maintainer, I want each PR small and passing on its own, so that a regression can be traced to one step and reverted alone.
39. As a maintainer, I want the 4.0.0 break recorded as an ADR, so that nobody "restores" the global build without knowing why it was dropped.

## Implementation Decisions

**Ordering and PR shape**
- Eight PRs into `master`, in the order listed under Solution. Each one passes lint, unit and func on its own. `master` stays unreleased until PR 6. 4.0.0 is ready to publish after PR 8.
- The code changes (PRs 2–4) run on the old webpack 3 / karma toolchain. That's why the baseline PR exists, even though PR 5 and PR 6 later delete most of what it fixes.

**PR 1: Baseline**
- Regenerate the lockfile with dependency versions that install and pass today. These are the pins Phase 0 found: @types packages from early 2018 (node 9.6.6, chai 4.1.3, lodash 4.14.107, lodash-es 4.17.0, glob 5.0.35, normalize-package-data 2.4.0), pegjs-loader 0.5.4, and tslint 5.9.1. Pinning the @types as a set may be more than strictly necessary.
- Raise the mocha timeout for func tests to 10s. The first test of each run times out at the 2s default.
- Add a headless Chrome launcher with the SwiftShader flags (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`) and make it the func-test default.
- Add a GitHub Actions workflow that runs lint, unit and func on Node 16 with Chrome, and delete CircleCI. Later PRs update this workflow when they change tooling.
- Remove the hand-written `gitHead` from package metadata.

**PR 2: TypeScript 6**
- The TS config sets the new defaults explicitly: `strict` off, `lib` dom + es2022, emit `target` es2017 (webpack 3's parser can't read newer syntax), `module` commonjs (the unit-test injection loader needs it), and `types` mocha + node.
- The eventemitter3 import in the base model becomes a default import. TS 6's always-on interop makes the namespace import non-constructable.
- The image-loading error callback in the resource manager is typed as returning a boolean, to match how its result is used.
- Unit-test mocks injected through inject-loader are wrapped as ES modules (`__esModule: true` plus `default`) so that default imports resolve under TS 6. This fix is expected but untested in the probe.
- The dev environment stays on Node 16 (karma 2 crashes on Node 22). Once the toolchain needs it, add webpack 3's legacy OpenSSL flag.
- Probe result (throwaway clone): with this config, type-checking gives 0 errors and func passes 60/60 on SwiftShader. Unit tests needed the interop wrap.

**PR 3: Replace lodash-es**
- Every lodash call becomes its native equivalent: array methods (`map`, `filter`, `flatMap`, `flat`, `includes`, `at`, `slice`, `sort`), `Object.assign`/`entries`/`fromEntries`/`values`, `typeof` checks, `Array.from({ length })` for `times`, `??=` for `defaults`, and a module-local counter for `uniqueId`. The `flow`/`partialRight` helpers become plain function composition.
- The `require` calls into lodash inside the expression grammar are rewritten natively as well.
- Go module by module, running the func suite after each group.
- lodash-es and its @types are removed from the package.

**PR 4: Emitter and stats.js**
- The base model gets a minimal emitter backed by a map from event name to a set of callbacks. Its public surface is exactly `on`, `addListener`, `removeListener` and `emit`, with eventemitter3-compatible signatures for those four. `once`, `off` and `removeAllListeners` aren't used anywhere and are not provided.
- `listenTo` and its cleanup counterpart keep working against that emitter. `Main`, `Container`, `Component` and `ResourceManager` inherit it unchanged.
- eventemitter3 is removed. stats.js stays as a static dependency (used only when `showStat` is on), pinned to `^0.17.0`.

**PR 5: vitest**
- Unit tests run under vitest. Mocks are ported to `vi.fn`/`vi.mock`, and typemoq, ts-mockito, inject-loader, chai and mocha-webpack are removed.
- Func tests run in vitest browser mode on Playwright Chromium, headless, with the same SwiftShader flags. The reference PNGs and resources are served as static files. Test discovery replaces the webpack `require.context` index with vitest's glob.
- `testTimeout` is 10s. Thresholds and reference PNGs are not changed.
- karma and its plugins are removed. Dev and CI move to Node ≥22, and the CI workflow runs Node 22 and 24.

**PR 6: tsdown, TypeScript 7, peggy and ESM + CJS output (4.0.0)**
- tsdown builds from the public entry point to ESM and CJS with type declarations, on a neutral platform. Build-time constants (the resource pack URL, which defaults to unpkg for the matching version, and the library version) are injected through tsdown's define.
- TypeScript 7 replaces TS 6. The TS 6 workarounds tied to webpack are dropped (es2017 emit target, commonjs module), and module resolution becomes bundler style.
- peggy replaces pegjs and pegjs-loader. The grammar is imported directly and compiled at build time by a small inline plugin shared by tsdown and vite/vitest. No generated parser is committed.
- The public entry keeps its default-export object (`Main`, `Component`, `ShaderProgram`, `WebAudioAnalyser`, `AnalyserAdapter`) unchanged and adds the same five as named exports.
- Package metadata becomes an ES module package:
  - an `exports` map (import → ESM, require → CJS, types);
  - a `files` allow-list of build output plus resources, replacing `.npmignore`;
  - `engines` node ≥22;
  - the old node-bundle `main` removed;
  - `readmeFilename` removed.
- The `window.Webvs` global build is removed (see the ADR on ESM + CJS only). The README's CDN section becomes a `<script type="module">` import from unpkg.
- webpack, ts-loader, webpack-serve, cross-env, shx, npm-run-all and typedoc (and the docs script) are removed. The examples page becomes a module that imports the source through vite. The preset files stay as plain scripts.

**PR 7: pnpm**
- npm is replaced by pnpm, with a pnpm lockfile instead of the npm one, and a `packageManager` field. CI uses pnpm. Any undeclared dependency that strict `node_modules` exposes is declared explicitly.

**PR 8: oxlint**
- tslint and its config are replaced by oxlint with its default rules plus the TypeScript plugin. Small mechanical findings are fixed. Rules that would need real code changes are turned off in config, with a one-line comment giving the reason. No formatter is added.

## Testing Decisions

- **What makes a good test here:** it checks external behaviour through the public API. A preset goes in, pixels come out, and the result is compared against a reference image. Tests don't assert on internals that the migration is free to change (which lodash function was used, how the emitter stores listeners).
- **Seam 1 (primary): the func pixel suite.** It drives the public `Main` API (construct with a mock analyser and controlled animation frames, `loadPreset`, `start`, `destroy`). It renders into a real WebGL canvas and fuzzy-compares the result against the 57 reference PNGs with per-test distance and mismatch thresholds. This seam covers:
  - every component code path, for the lodash removal;
  - the emitter end to end: `Main` listens to the resource manager's `wait`/`ready` events, and EffectList, GlobalVar, SuperScope and Texer listen to `resize`, all through `listenTo`;
  - the compile changes from TS 6 and TS 7.

  Every PR must keep it at **60/60 with thresholds and PNGs frozen** at HEAD's values.
- **Seam 2: the existing unit tests (6).** Resize handling with mocked collaborators (EffectList, GlobalVar, SuperScope, Texer, DynamicMovement). They're only changed mechanically: the interop wrap in PR 2 and the port to vitest mocks in PR 5. No new unit tests are added.
- **Seam 3 (new, PR 6): a package smoke check.** It tests the published package from the outside:
  - `require('webvs')` and `import('webvs')` both resolve and expose `Main` (and the rest) through the default export and the named exports;
  - type declarations resolve;
  - the pack listing contains only build output and resources;
  - manually, the examples page renders a preset through the dev server and `rsrcMan.on('ready')` fires. This is the only coverage of `on`.
- **No dedicated emitter unit test.** The func suite exercises it end to end.
- **Baseline reference (Phase 0, master HEAD 17166a1 with pinned deps):**
  - lint passes;
  - unit 6/6;
  - func 60/60 on both SwiftShader and a real GPU, with a timeout of at least 5s.

  At the stock 2s timeout, every run had 1–2 timeouts: Main "should render components", sometimes "clear screen to color", and SuperScope "should render dots".
- **Threshold headroom is thin. Treat failures as signal, not noise.**
  - DynamicMovement blend cases measured a max distance of about 60–65 on 3.0.0 output, against a distanceThreshold of 80.
  - Main "should render components": 14 px against 20.
  - Mosaic onBeatSizeChange: 2.45 against 5.

  If a func test fails under a new runner or compiler, investigate first. Loosen a threshold or regenerate a PNG only with the reason written in the PR.
- **Prior art:** the existing `mainTest` / fuzzy image comparison helpers for func tests, and the existing resize-handling unit tests.

## Out of Scope

- The `_webvs-esm` clone and anything on it.
- The consumer repos (react-webvs-player, svelte-webvs-player and others). They stay on `^3.0.0` until someone bumps them.
- Publishing 4.0.0, release automation, and changesets setup. The maintainer handles those.
- Turning on TypeScript `strict` mode.
- A code formatter.
- Lazy-loading stats.js or making it a peer dependency.
- Rendering or behaviour changes of any kind. This is a like-for-like migration.

## Further Notes

- The ADR for the 4.0.0 break is in the repo's ADR directory: ESM + CJS only, no global build.
- Phase 0 found that 3.0.0 itself never passed in CI. CircleCI was added after the release, and every func failure at 3.0.0 was a threshold that later commits loosened. HEAD's thresholds are therefore the reference, not 3.0.0's.
- TypeScript 7 is the native (Go) compiler, so it can't run under ts-loader. That's why TS 7 waits for PR 6 and PR 2 stops at TS 6.
- The earlier plan file in `~/.claude/plans/` is superseded by this spec. Its phase order, TS version and "skip the baseline" assumptions are all out of date.
