import { playwright } from "@vitest/browser-playwright";
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import peggy from "./peggy.plugin.ts";

export default defineConfig({
    plugins: [peggy],
    define: {
        RESOURCE_PACK_URL: JSON.stringify("/resources/"),
        WEBVS_VERSION: JSON.stringify(JSON.parse(readFileSync("package.json", "utf8")).version),
    },
    test: {
        globals: true,
        testTimeout: 10000,
        projects: [
            {
                extends: true,
                test: {
                    clearMocks: true,
                    include: ["test/unit/**/*.test.ts"],
                    name: "unit",
                },
            },
            {
                extends: true,
                test: {
                    browser: {
                        enabled: true,
                        headless: true,
                        instances: [{ browser: "chromium" }],
                        provider: playwright({
                            launchOptions: {
                                args: [
                                    "--use-gl=angle",
                                    "--use-angle=swiftshader",
                                    "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist",
                                ],
                            },
                        }),
                    },
                    include: ["test/func/**/*.test.ts"],
                    name: "func",
                },
            },
        ],
    },
});
