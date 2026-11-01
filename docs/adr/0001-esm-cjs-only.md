# Ship ESM and CJS only, no `window.Webvs` global build

From 4.0.0, webvs publishes only ESM and CJS builds; the `dist/webvs.js` / `webvs.min.js` script-tag bundles that exposed a `window.Webvs` global are gone. No known consumer used the global (react-webvs-player and svelte-webvs-player both `import Webvs from 'webvs'`); it only served the README's unpkg `<script>` snippet and the repo's own examples, and browsers can load the ESM build directly via `<script type="module">`. Anyone loading webvs through a plain script tag from a CDN breaks, which is why this is a major release.

## Considered Options

- **Keep an IIFE build alongside ESM and CJS.** Cheap to emit with tsdown, but it keeps a third output format to test and document for users we couldn't find.
