# 07: tsdown build: ESM + CJS only (4.0.0 break)

**What to build:** The package is built by tsdown as ESM + CJS with type declarations, and the `window.Webvs` global build is gone, per the ADR on ESM + CJS only. npm consumers keep `import Webvs from 'webvs'` and can also use named imports. See the spec's "PR 6".

**Blocked by:** 05 (peggy with a committed parser), 06 (vitest for unit and func tests)

**Status:** ready-for-agent

- [ ] tsdown builds the public entry point to ESM and CJS with type declarations, on a neutral platform. The resource pack URL (defaulting to unpkg for the matching version) and the library version are injected via define
- [ ] The default-export object (`Main`, `Component`, `ShaderProgram`, `WebAudioAnalyser`, `AnalyserAdapter`) is unchanged. The same five are also named exports
- [ ] Package metadata: `"type": "module"`, an `exports` map (import / require / types), `files` limited to build output plus resources, `engines` node ≥22. Old `main` and `readmeFilename` removed. `.npmignore` deleted
- [ ] webpack, ts-loader, webpack-serve, cross-env, shx, npm-run-all and typedoc (with its docs script) removed
- [ ] Package smoke check passes: `require('webvs')` and `import('webvs')` both expose `Main` via default and named exports, type declarations resolve, and the pack listing contains only build output and resources
- [ ] Func 60/60 with thresholds and PNGs unchanged. Unit 6/6. Lint passes. CI green, including the smoke check
