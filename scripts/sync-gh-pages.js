#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const syncAll = process.argv.includes("--all");

if (syncAll) {
  assertCleanWorktree();
}

run("npm", ["run", "check:content"]);
run("npm", ["run", "build"]);

if (syncAll) {
  run("git", ["push", "origin", "HEAD"]);
}

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
  const result =
    process.platform === "win32"
      ? spawnSync([command, ...args.map(quoteShellArg)].join(" "), {
          stdio: "inherit",
          shell: true
        })
      : spawnSync(command, args, {
          stdio: "inherit",
          shell: false
        });
  if (result.status !== 0) {
    if (result.error) process.stderr.write(`${result.error.message}\n`);
    process.exit(result.status ?? 1);
  }
}

function quoteShellArg(value) {
  if (!/[^\w:./-]/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}
