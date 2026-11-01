# 05: peggy with a committed parser

**What to build:** The expression grammar is compiled by peggy instead of pegjs. The generated parser is committed and imported as a plain module, so no build step needs a grammar loader. See the spec's "PR 6" notes on peggy, pulled forward.

**Blocked by:** 03 (Replace lodash-es), because the grammar must be lodash-free first

**Status:** resolved

- [x] pegjs and pegjs-loader removed. peggy added as a dev dependency
- [x] Generated parser committed. The expression compiler imports it directly, with no loader rule
- [x] A `gen:grammar` script regenerates the parser from the grammar. Re-running it on an unchanged grammar produces no diff
- [x] Still builds and tests on webpack 3: func 60/60, unit 6/6, lint passes
- [x] CI green
