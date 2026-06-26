import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ContentStoreError,
  assertContentId,
  assertContentType,
  createContentStore
} from "../tools/content-studio/server/content-store.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = createContentStore(rootDir);

test("content store lists all three content types including archived entries", async () => {
  const tempRoot = await createTempRoot();
  try {
    await writeListFixtureContent(tempRoot);
    const tempStore = createContentStore(tempRoot);
    const items = await tempStore.list();

    assert.ok(items.some((item) => item.type === "docs"));
    assert.ok(items.some((item) => item.type === "projects"));
    assert.ok(items.some((item) => item.type === "life"));
    assert.ok(items.some((item) => item.status === "archived"));
    assert.equal(items.at(-1)?.status, "archived");
    assert.equal(items.find((item) => item.id === "fixture-project")?.category, "maintained");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("content store returns parsed frontmatter and markdown for a known document", async () => {
  const item = await store.get("docs", "content-workflow");
  assert.equal(item?.id, "content-workflow");
  assert.equal(item?.status, "published");
  assert.match(item?.markdown ?? "", /# 内容系统与维护工作流/);
  assert.equal(item?.relativePath, "docs/content-workflow.md");
});

test("content store rejects untrusted type and id values", () => {
  assert.throws(() => assertContentType("../docs"), ContentStoreError);
  assert.throws(() => assertContentId("../content-workflow"), ContentStoreError);
  assert.throws(() => assertContentId("Content Workflow"), ContentStoreError);
});

test("content store creates a draft and matching image directory", async () => {
  const tempRoot = await createTempRoot();
  try {
    const tempStore = createContentStore(tempRoot);
    const result = await tempStore.create("projects", {
      id: "studio-new-project",
      title: "Studio New Project",
      summary: "Created from the local content studio.",
      meta: "STM32, FreeRTOS, PID",
      projectStage: "building"
    });

    assert.equal(result.item.id, "studio-new-project");
    assert.equal(result.item.type, "projects");
    assert.equal(result.item.status, "draft");
    assert.equal(result.item.projectStage, "building");
    assert.deepEqual(result.item.tags, ["STM32", "FreeRTOS", "PID"]);
    assert.equal(result.paths.markdown, "docs-vitepress/projects/studio-new-project.md");
    assert.equal(result.paths.images, "public/images/projects/studio-new-project");

    const saved = await readFile(path.join(tempRoot, "docs-vitepress/projects/studio-new-project.md"), "utf8");
    assert.match(saved, /projectStage: building/);
    assert.match(saved, /# Studio New Project/);

    const keepFile = await readFile(path.join(tempRoot, "public/images/projects/studio-new-project/.gitkeep"), "utf8");
    assert.equal(keepFile, "");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("content store rejects duplicate content ids while creating", async () => {
  const tempRoot = await createTempRoot();
  try {
    const tempStore = createContentStore(tempRoot);
    await assert.rejects(
      () =>
        tempStore.create("docs", {
          id: "studio-save-check",
          title: "Duplicate Studio Note",
          summary: "This should not overwrite the existing note."
        }),
      (error) => error instanceof ContentStoreError && error.code === "CONTENT_ALREADY_EXISTS" && error.status === 409
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("content store saves markdown with a backup copy", async () => {
  const tempRoot = await createTempRoot();
  try {
    const tempStore = createContentStore(tempRoot);
    const item = await tempStore.get("docs", "studio-save-check");
    assert.ok(item);

    const result = await tempStore.save("docs", "studio-save-check", {
      expectedModifiedAt: item.modifiedAt,
      frontmatter: {
        ...item.frontmatter,
        title: "Updated Studio Note",
        summary: "Updated from the local content studio.",
        tags: ["studio", "save"]
      },
      markdown: "# Updated Studio Note\n\nSaved body."
    });

    assert.equal(result.item.title, "Updated Studio Note");
    assert.equal(result.item.summary, "Updated from the local content studio.");
    assert.match(result.backup, /tools\/content-studio\/\.backups\/.*-docs-studio-save-check\.md$/);

    const saved = await readFile(path.join(tempRoot, "docs-vitepress/docs/studio-save-check.md"), "utf8");
    assert.match(saved, /Updated from the local content studio/);
    assert.match(saved, /# Updated Studio Note/);

    const backup = await readFile(path.resolve(tempRoot, "docs-vitepress", result.backup), "utf8");
    assert.match(backup, /Original Studio Note/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("content store rejects saves with a stale modified time", async () => {
  const tempRoot = await createTempRoot();
  try {
    const tempStore = createContentStore(tempRoot);
    const item = await tempStore.get("docs", "studio-save-check");
    assert.ok(item);

    await assert.rejects(
      () =>
        tempStore.save("docs", "studio-save-check", {
          expectedModifiedAt: "2000-01-01T00:00:00.000Z",
          frontmatter: item.frontmatter,
          markdown: item.markdown
        }),
      (error) => error instanceof ContentStoreError && error.code === "CONTENT_CONFLICT" && error.status === 409
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "content-studio-"));
  const docsDir = path.join(tempRoot, "docs-vitepress/docs");
  await mkdir(docsDir, { recursive: true });
  await writeFile(
    path.join(docsDir, "studio-save-check.md"),
    `---
id: studio-save-check
title: Original Studio Note
status: draft
category: Tooling
tags:
  - studio
level: beginner
updatedAt: 2026-06-25
readingTime: 2 min
summary: Original summary.
---

# Original Studio Note

Original body.
`,
    "utf8"
  );
  return tempRoot;
}

async function writeListFixtureContent(rootDir) {
  await mkdir(path.join(rootDir, "docs-vitepress/projects"), { recursive: true });
  await mkdir(path.join(rootDir, "docs-vitepress/life"), { recursive: true });

  await Promise.all([
    writeFile(
      path.join(rootDir, "docs-vitepress/projects/fixture-project.md"),
      `---
id: fixture-project
title: Fixture Project
status: published
projectStage: maintained
updatedAt: 2026-06-25
summary: Fixture project.
---

# Fixture Project
`,
      "utf8"
    ),
    writeFile(
      path.join(rootDir, "docs-vitepress/life/fixture-life.md"),
      `---
id: fixture-life
title: Fixture Life
status: archived
tag: Life
date: 2026-06-25
summary: Fixture life post.
---

# Fixture Life
`,
      "utf8"
    )
  ]);
}
