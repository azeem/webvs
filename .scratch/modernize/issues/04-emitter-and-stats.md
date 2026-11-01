# 04: Minimal emitter and pinned stats.js

**What to build:** eventemitter3 is replaced by a minimal emitter in the base model, so consumers keep `on`, `addListener`, `removeListener` and `emit` with the same signatures. stats.js is pinned to a real version range. See the spec's "PR 4: Emitter and stats.js".

**Blocked by:** 02 (TypeScript 6)

**Status:** resolved

- [x] The base model provides exactly `on`, `addListener`, `removeListener` and `emit`, backed by a map of event name to a set of callbacks. Signatures are compatible with eventemitter3 for those four
- [x] `listenTo` and its cleanup counterpart work against the new emitter. `Main`, `Container`, `Component` and `ResourceManager` need no API change
- [x] eventemitter3 removed from package metadata and lockfile
- [x] stats.js pinned to `^0.17.0`
- [x] Func 60/60 with thresholds and PNGs unchanged (this covers resize and resource wait/ready events end to end). Unit 6/6. Lint passes
- [x] CI green
