// Starts Vitest from a "C:\..." path. On Windows, VS Code can open the project
// as "c:\...", which makes Vitest load itself twice and fail every test with
// "failed to find the current suite". Does nothing different on Mac/Linux.
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const cwd = process.cwd().replace(/^[a-z]:/, (d) => d.toUpperCase());
const entry = join(cwd, "node_modules", "vitest", "vitest.mjs");
const result = spawnSync(process.execPath, [entry, ...process.argv.slice(2)], { cwd, stdio: "inherit" });
process.exit(result.status ?? 1);
