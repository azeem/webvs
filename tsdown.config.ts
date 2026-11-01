import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

export default defineConfig({
    entry: "index.ts",
    format: ["esm", "cjs"],
    dts: true,
    platform: "neutral",
    outputOptions: { exports: "named" },
    define: {
        RESOURCE_PACK_URL: JSON.stringify(`https://unpkg.com/webvs@${version}/resources/`),
        WEBVS_VERSION: JSON.stringify(version),
    },
});
