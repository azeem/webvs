# 09: TypeScript 7

**What to build:** The project compiles with TypeScript 7, the native compiler, and drops the TS config workarounds that only existed for webpack 3 and inject-loader.

**Blocked by:** 07 (tsdown build: ESM + CJS only)

**Status:** ready-for-agent

- [ ] TypeScript 7 replaces 6
- [ ] TS config: es2017 emit target and commonjs module workarounds removed. Module resolution is bundler style. `strict` stays off
- [ ] Type check 0 errors. Type declarations still generate
- [ ] Package smoke check, func 60/60 (thresholds and PNGs unchanged), unit and lint pass. CI green
