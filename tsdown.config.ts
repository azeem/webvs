import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";
import peggy from "./peggy.plugin.ts";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

export default defineConfig({
    entry: "index.ts",
    format: ["esm", "cjs"],
    dts: true,
    platform: "neutral",
    plugins: [peggy],
    outputOptions: { exports: "named" },
    define: {
        RESOURCE_PACK_URL: JSON.stringify("resources/"),
        WEBVS_VERSION: JSON.stringify(version),
    },
});
