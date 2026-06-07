#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const syncAll = process.argv.includes("--all");

if (syncAll) {
  assertCleanWorktree();
  run("git", ["push", "origin", "HEAD"]);
}

run("npm", ["run", "check:content"]);
run("npm", ["run", "build"]);
run("npx", ["gh-pages", "-d", "dist", "-m", "sync gh-pages"]);

function assertCleanWorktree() {
  const result = spawnSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
    shell: false
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "Failed to check git status.\n");
    process.exit(result.status ?? 1);
  }
  if (result.stdout.trim()) {
    process.stderr.write("Working tree is not clean. Commit changes before running sync:all.\n");
    process.stderr.write("Use npm run sync:gh-pages if you only want to publish the current build.\n");
    process.exit(1);
  }
}

function run(command, args) {
  const result = spawnSync(resolveCommand(command), args, {
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveCommand(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "npx") return `${command}.cmd`;
  return command;
}
