# 07: tsdown build: ESM + CJS only (4.0.0 break)

**What to build:** The package is built by tsdown as ESM + CJS with type declarations, and the `window.Webvs` global build is gone, per the ADR on ESM + CJS only. npm consumers keep `import Webvs from 'webvs'` and can also use named imports. See the spec's "PR 6".

**Blocked by:** 05 (peggy with a committed parser), 06 (vitest for unit and func tests)

**Status:** resolved

- [x] tsdown builds the public entry point to ESM and CJS with type declarations, on a neutral platform. The resource pack URL (defaulting to unpkg for the matching version) and the library version are injected via define
- [x] The default-export object (`Main`, `Component`, `ShaderProgram`, `WebAudioAnalyser`, `AnalyserAdapter`) is unchanged. The same five are also named exports
- [x] Package metadata: `"type": "module"`, an `exports` map (import / require / types), `files` limited to build output plus resources, `engines` node ≥22. Old `main` and `readmeFilename` removed. `.npmignore` deleted
- [x] webpack, ts-loader, webpack-serve, cross-env, shx, npm-run-all and typedoc (with its docs script) removed
- [x] Package smoke check passes: `require('webvs')` and `import('webvs')` both expose `Main` via default and named exports, type declarations resolve, and the pack listing contains only build output and resources
- [x] Func 60/60 with thresholds and PNGs unchanged. Unit 6/6. Lint passes. CI green, including the smoke check

## Comments

**Agent, 2026-11-01:** Implemented. CI passed on Node 22 and 24 after the push. Local on Node 24.20.0: tsc 0 errors, lint passes, unit 9/9, func 60/60, thresholds and PNGs unchanged. tsdown 0.23.1 pinned (newest release at least two weeks old). The build emits `dist/index.{js,cjs,d.ts,d.cts}`, with `stats.js` left external. `outputOptions.exports: "named"` stops the CJS mixed-exports warning; `require('webvs')` exposes both `.default` and the named exports. The smoke check (`npm run smoke-test`, run after `npm run build`) resolves the package through its own exports map (self-reference) for both `require` and `import`. It type-checks an ESM fixture and a CJS `.cts` fixture against `index.d.ts` and `index.d.cts`, and asserts the `npm pack` listing has only `dist/`, `resources/` and the files npm always includes. CI gains build + smoke steps. The `dev` and `clean` scripts went with webpack-serve and shx. Ticket 08 restores a dev server via vite. `version` is still 3.0.0, so the baked-in resource URL points at `webvs@3.0.0` until the release bump.
