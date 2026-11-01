import { readFileSync } from "node:fs";
import peggy from "peggy";

// Compiles imported .pegjs grammars to ES modules; shared by tsdown and vite/vitest.
export default {
    name: "peggy",
    load(id: string) {
        if (!id.endsWith(".pegjs")) {
            return null;
        }
        return {
            code: peggy.generate(readFileSync(id, "utf8"), { output: "source", format: "es", grammarSource: id }),
            moduleType: "js" as const,
        };
    },
};
