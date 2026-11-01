# 09: TypeScript 7

**What to build:** The project compiles with TypeScript 7, the native compiler, and drops the TS config workarounds that only existed for webpack 3 and inject-loader.

**Blocked by:** 07 (tsdown build: ESM + CJS only)

**Status:** resolved

- [x] TypeScript 7 replaces 6
- [x] TS config: es2017 emit target and commonjs module workarounds removed. Module resolution is bundler style. `strict` stays off
- [x] Type check 0 errors. Type declarations still generate
- [x] Package smoke check, func 60/60 (thresholds and PNGs unchanged), unit and lint pass. CI green

## Comments

**Agent, 2026-11-01:** Implemented. CI green after the push. TypeScript 7.0.2. Local on Node 24: tsc 0 errors, lint passes, unit 9/9, func 60/60 with thresholds and PNGs unchanged, build emits `.d.ts`/`.d.cts`, smoke check passes. The TS config drops `target` and `module: commonjs` for `module: preserve` + `moduleResolution: bundler`. Two things beyond the spec:
- `useDefineForClassFields: false` is now explicit. Before, it followed from the es2017 target. TS 7's ESNext default switches on define semantics. `Component`'s constructor calls `init()`, which sets subclass fields, so define semantics would reset every uninitialized subclass field to `undefined` after `super()`. tsc flagged it as TS2612 on 18 `opts` redeclarations.
- tslint 5.9 can't run on TS 7 because TS 7 ships no JS API, and an npm override can't nest the peer dependency. With the maintainer's OK, ticket 11 (oxlint) is folded into this one. oxlint 1.88.0, `.oxlintrc.json` with the default plugins (typescript, unicorn, oxc), and lint runs with `--deny-warnings`. The only default rule that fired was `no-unused-vars`. Unused imports, dead `lastR/G/B` in SuperScope, unused test bindings and dead `tslint:` directives are removed. Unused-parameter checks are turned off (`args: none`) because those parameters match interface and override signatures. The generated parser is ignored.
