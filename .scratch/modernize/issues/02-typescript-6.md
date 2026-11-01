# 02: TypeScript 6 on the existing toolchain

**What to build:** The codebase compiles with TypeScript 6 and an es2022 lib on the existing webpack 3 / karma toolchain, so later tickets can use modern native methods. See the spec's "PR 2: TypeScript 6".

**Blocked by:** 01 (Baseline)

**Status:** ready-for-agent

- [ ] TypeScript 6 installed. The TS config sets explicitly: `strict` off, lib dom + es2022, emit target es2017, module commonjs, types mocha + node
- [ ] eventemitter3 imported as a default import, so the base model's emitter type-checks under always-on interop
- [ ] The image-loading error callback in the resource manager is typed as returning a boolean, matching how it's used
- [ ] Unit-test mocks injected via inject-loader are shaped as ES modules, so default imports resolve
- [ ] Type check reports 0 errors
- [ ] Lint, unit 6/6 and func 60/60 pass locally and in CI. Thresholds and PNGs unchanged
- [ ] Dev and CI stay on Node 16. The legacy OpenSSL flag is added only if the toolchain needs it
