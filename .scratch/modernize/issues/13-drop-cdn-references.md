# 13: Drop webvs's own CDN references

**What to build:** webvs no longer points users at a CDN. The builtin resource pack loads from `resources/`, resolved against the page URL, instead of unpkg. The README no longer has a CDN section. Instead, it says in one line how to make the builtin resources available: serve the package's `resources/` folder next to the page, or pass `resourcePrefix` to `Main`. Third-party CDN use in the examples page (CodeMirror) stays, and so do the ADR and the earlier modernize tickets and spec, which are historical records.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The published build's default resource pack prefix is the relative `resources/`. No unpkg URL remains in the build output
- [ ] The test and dev-server configuration keeps serving resources from `/resources/`, so tests and the examples page still load the builtin resources
- [ ] The README's CDN section is gone, including the unpkg import and the jsDelivr import map for stats.js. One line explains `resources/` and `resourcePrefix`
- [ ] Searching the repo for unpkg, jsDelivr and CDN finds nothing outside the examples page's CodeMirror tags, the ADR, `.scratch/`, `node_modules` and the lockfile
- [ ] Unit, functional and smoke tests pass
