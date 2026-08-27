import { access, mkdir, rename, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const apiDirectory = path.join(root, "app", "api");
const temporaryDirectory = path.join(root, ".pages-build", "api");

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Build exited with code ${code}`)));
  });
}

if (!await exists(apiDirectory)) throw new Error("Expected app/api routes were not found.");
await mkdir(path.dirname(temporaryDirectory), { recursive: true });
await rename(apiDirectory, temporaryDirectory);
try {
  await run("npm", ["run", "build"], { ...process.env, NEXT_PUBLIC_MATCH_MODE: "demo" });
} finally {
  await rename(temporaryDirectory, apiDirectory);
  await rm(path.dirname(temporaryDirectory), { recursive: true, force: true });
}
