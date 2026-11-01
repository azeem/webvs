# 03: Replace lodash-es with native code

**What to build:** webvs no longer depends on lodash-es. Every call, including the ones inside the expression grammar, becomes plain native JavaScript, and rendering stays identical. See the spec's "PR 3: Replace lodash-es".

**Blocked by:** 02 (TypeScript 6)

**Status:** resolved

- [x] No lodash import or require remains in source, grammar or tests
- [x] Replacements are native equivalents, not a home-grown lodash-style utility layer. `uniqueId` becomes a module-local counter, `flow`/`partialRight` become plain composition
- [x] lodash-es and its @types removed from package metadata and lockfile
- [x] Func 60/60 with thresholds and PNGs unchanged. Unit 6/6. Lint passes
- [x] CI green
