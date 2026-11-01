// Package smoke check: run after `pnpm build`. Resolves webvs through its
// own exports map (package self-reference), like a consumer would.
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const names = ["Main", "Component", "ShaderProgram", "WebAudioAnalyser", "AnalyserAdapter"];

function check(mod, format) {
    for (const name of names) {
        assert.equal(typeof mod.default[name], "function", `${format} default.${name}`);
        assert.equal(mod[name], mod.default[name], `${format} named ${name}`);
    }
}

check(createRequire(import.meta.url)("@visbot/webvs"), "require");
check(await import("@visbot/webvs"), "import");

execSync("pnpm exec tsc -p test/smoke/tsconfig.json", { stdio: "inherit" });

const { files } = JSON.parse(execSync("pnpm pack --dry-run --json --ignore-scripts", { encoding: "utf8" }));
const stray = files.map((f) => f.path)
    .filter((p) => !/^(dist|resources)\/|^(package\.json|README\.md|license\.txt|CHANGELOG\.md)$/.test(p));
assert.deepEqual(stray, [], "pack listing has only build output and resources");

console.log("smoke check passed");
