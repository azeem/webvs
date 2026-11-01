# 08: Examples and README on the module build

**What to build:** The examples page runs straight from source through a vite dev server, and the README shows CDN users how to load webvs as an ES module now that the global build is gone.

**Blocked by:** 07 (tsdown build: ESM + CJS only)

**Status:** ready-for-agent

- [ ] The examples' test page is an ES module importing the library from source. A dev script serves it via vite, and the preset files stay plain scripts
- [ ] Manual check: a preset renders in the browser and the `rsrcMan.on('ready')` listener fires (record the result in the PR)
- [ ] The README's CDN section uses a `<script type="module">` import from unpkg. No reference to `window.Webvs`, `dist/webvs.js` or `webvs.min.js` remains
- [ ] The README's npm usage section is still accurate (default import, plus a named-import example)
