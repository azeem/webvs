# 08: Examples and README on the module build

**What to build:** The examples page runs straight from source through a vite dev server, and the README shows CDN users how to load webvs as an ES module now that the global build is gone.

**Blocked by:** 07 (tsdown build: ESM + CJS only)

**Status:** resolved

- [x] The examples' test page is an ES module importing the library from source. A dev script serves it via vite, and the preset files stay plain scripts
- [x] Manual check: a preset renders in the browser and the `rsrcMan.on('ready')` listener fires (record the result in the PR)
- [x] The README's CDN section uses a `<script type="module">` import from unpkg. No reference to `window.Webvs`, `dist/webvs.js` or `webvs.min.js` remains
- [x] The README's npm usage section is still accurate (default import, plus a named-import example)

**Agent, 2026-11-01:** Implemented. CI passed after the push. Local: tsc 0 errors, unit 9/9, func 60/60, smoke check passes. `npm run dev` runs vite with `vitest.config.mts`, reusing its defines, and opens `/examples/`. `test-page.js` is a module importing `../index.ts`. The preset scripts are plain `defer` scripts, so they register before `initPage` runs on `DOMContentLoaded`. `vite` 8.3.5 is now a declared devDependency. Manual check in Chrome: Silk Strings renders. Loading "pillow fight" fetched three `.bmp` files from `/resources/` (200), and the overlay went block→none, so the `rsrcMan` `wait` and `ready` listeners fired. README CDN: unpkg's `?module` no longer rewrites bare imports, and stats.js has no ESM build. So the snippet adds an import map that sends `stats.js` to jsDelivr's `+esm`, and it was tested against a locally served `dist/index.js`. The `webvs@4` URL resolves only after the 4.0.0 publish.
