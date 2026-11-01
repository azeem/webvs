# 02: TypeScript 6 on the existing toolchain

**What to build:** The codebase compiles with TypeScript 6 and an es2022 lib on the existing webpack 3 / karma toolchain, so later tickets can use modern native methods. See the spec's "PR 2: TypeScript 6".

**Blocked by:** 01 (Baseline)

**Status:** resolved

- [x] TypeScript 6 installed. The TS config sets explicitly: `strict` off, lib dom + es2022, emit target es2017, module commonjs, types mocha + node
- [x] eventemitter3 imported as a default import, so the base model's emitter type-checks under always-on interop
- [x] The image-loading error callback in the resource manager is typed as returning a boolean, matching how it's used
- [x] Unit-test mocks injected via inject-loader are shaped as ES modules, so default imports resolve
- [x] Type check reports 0 errors
- [x] Lint, unit 6/6 and func 60/60 pass locally and in CI. Thresholds and PNGs unchanged
- [x] Dev and CI stay on Node 16. The legacy OpenSSL flag is added only if the toolchain needs it

## Comments

**Agent, 2026-11-01:** Implemented. Local on Node 16.20.1: tsc 0 errors, lint passes, unit 6/6, func 60/60, no OpenSSL flag needed. Also needed beyond the spec: `@types/mocha` 5.2.7 and the `@types/node` override bumped to 16.18.126 (the 2018 typings don't parse under TS 6), `require.context` cast in the func test index, a seedrandom default import in the Mirror test (it failed at runtime under interop), and the WebGL-only `preserveDrawingBuffer` dropped from a 2d `getContext` call. CI passed after the push.
