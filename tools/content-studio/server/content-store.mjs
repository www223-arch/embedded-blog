import { copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseMarkdownSource, stringifyMarkdownSource, valueAsContentStatus, valueAsProjectStage, valueAsString, valueAsStringArray } from "../../../src/content-core/frontmatter.ts";

export const contentTypes = ["docs", "projects", "life"];

const contentDirectories = {
  docs: "docs",
  projects: "projects",
  life: "life"
};

const writeLocks = new Map();

export function createContentStore(rootDir) {
  const projectRoot = path.resolve(rootDir);
  const contentRoot = path.resolve(rootDir, "docs-vitepress");
  const publicRoot = path.resolve(rootDir, "public");
  const backupRoot = path.resolve(rootDir, "tools/content-studio/.backups");

  return {
    async list(type) {
      const types = type ? [assertContentType(type)] : contentTypes;
      const groups = await Promise.all(types.map((itemType) => listType(contentRoot, itemType)));
      return groups
        .flat()
        .sort(
          (a, b) =>
            statusRank(a.status) - statusRank(b.status) ||
            typeRank(a.type) - typeRank(b.type) ||
            b.updatedAt.localeCompare(a.updatedAt) ||
            a.title.localeCompare(b.title)
        );
    },

    async get(type, id) {
      const safeType = assertContentType(type);
      const safeId = assertContentId(id);
      const entries = await readTypeEntries(contentRoot, safeType);
      const match = entries.find((entry) => valueAsString(entry.frontmatter.id, entry.fileId) === safeId);
      if (!match) return null;
      return toDetail(safeType, match);
    },

    async create(type, input) {
      const safeType = assertContentType(type);
      const draft = createDraftInput(safeType, input);
      return withContentLock(`${safeType}:${draft.id}`, async () => createContent(projectRoot, contentRoot, publicRoot, safeType, draft));
    },

    async save(type, id, input) {
      const safeType = assertContentType(type);
      const safeId = assertContentId(id);
      return withContentLock(`${safeType}:${safeId}`, async () => saveContent(contentRoot, backupRoot, safeType, safeId, input));
    }
  };
}

export function assertContentType(value) {
  if (!contentTypes.includes(value)) {
    throw new ContentStoreError("INVALID_CONTENT_TYPE", "不支持的内容类型。", 400);
  }
  return value;
}

export function assertContentId(value) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(value)) {
    throw new ContentStoreError("INVALID_CONTENT_ID", "内容 ID 只能包含小写字母、数字和连字符。", 400);
  }
  return value;
}

export class ContentStoreError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.name = "ContentStoreError";
    this.code = code;
    this.status = status;
  }
}

async function saveContent(contentRoot, backupRoot, type, id, input) {
  const entries = await readTypeEntries(contentRoot, type);
  const entry = entries.find((candidate) => valueAsString(candidate.frontmatter.id, candidate.fileId) === id);
  if (!entry) {
    throw new ContentStoreError("CONTENT_NOT_FOUND", "没有找到这项内容。", 404);
  }

  const frontmatter = normalizeFrontmatter(input?.frontmatter, id);
  const markdown = typeof input?.markdown === "string" ? input.markdown : "";
  if (!markdown.trim()) {
    throw new ContentStoreError("EMPTY_MARKDOWN", "正文不能为空。", 400);
  }

  if (input?.expectedModifiedAt && input.expectedModifiedAt !== entry.modifiedAt) {
    throw new ContentStoreError("CONTENT_CONFLICT", "磁盘文件已经被其他窗口或工具修改，请刷新后再保存。", 409);
  }

  const filePath = path.resolve(contentRoot, entry.relativePath);
  assertInside(contentRoot, filePath);
  const backupPath = await backupOriginalFile(backupRoot, type, id, filePath);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await writeFile(tempPath, stringifyMarkdownSource(frontmatter, markdown), "utf8");
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }

  const [raw, fileStat] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
  const parsed = parseMarkdownSource(raw);
  return {
    item: toDetail(type, {
      ...parsed,
      fileId: entry.fileId,
      relativePath: entry.relativePath,
      modifiedAt: fileStat.mtime.toISOString()
    }),
    backup: path.relative(contentRoot, backupPath).replace(/\\/g, "/")
  };
}

async function createContent(projectRoot, contentRoot, publicRoot, type, draft) {
  const entries = await readTypeEntries(contentRoot, type);
  const duplicate = entries.find((entry) => valueAsString(entry.frontmatter.id, entry.fileId) === draft.id || entry.fileId === draft.id);
  if (duplicate) {
    throw new ContentStoreError("CONTENT_ALREADY_EXISTS", "这个 ID 已经存在，请换一个。", 409);
  }

  const directory = path.resolve(contentRoot, contentDirectories[type]);
  const filePath = path.resolve(directory, `${draft.id}.md`);
  assertInside(contentRoot, directory);
  assertInside(contentRoot, filePath);

  await mkdir(directory, { recursive: true });
  const exists = await fileExists(filePath);
  if (exists) {
    throw new ContentStoreError("CONTENT_ALREADY_EXISTS", "这个 Markdown 文件已经存在，请换一个 ID。", 409);
  }

  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(tempPath, stringifyMarkdownSource(draft.frontmatter, draft.markdown), "utf8");
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }

  const assetDirectory = await createImageAssetDirectory(projectRoot, publicRoot, type, draft.id);
  const [raw, fileStat] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
  const parsed = parseMarkdownSource(raw);
  return {
    item: toDetail(type, {
      ...parsed,
      fileId: draft.id,
      relativePath: path.relative(contentRoot, filePath).replace(/\\/g, "/"),
      modifiedAt: fileStat.mtime.toISOString()
    }),
    paths: {
      markdown: path.relative(projectRoot, filePath).replace(/\\/g, "/"),
      images: path.relative(projectRoot, assetDirectory).replace(/\\/g, "/")
    }
  };
}

async function listType(contentRoot, type) {
  const entries = await readTypeEntries(contentRoot, type);
  return entries.map((entry) => toSummary(type, entry));
}

async function readTypeEntries(contentRoot, type) {
  const directory = path.resolve(contentRoot, contentDirectories[type]);
  assertInside(contentRoot, directory);
  const files = await listMarkdownFiles(directory);

  return Promise.all(
    files.map(async (filePath) => {
      const [raw, fileStat] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
      const parsed = parseMarkdownSource(raw);
      return {
        ...parsed,
        fileId: path.basename(filePath, ".md"),
        relativePath: path.relative(contentRoot, filePath).replace(/\\/g, "/"),
        modifiedAt: fileStat.mtime.toISOString()
      };
    })
  );
}

async function listMarkdownFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.resolve(directory, entry.name);
      assertInside(directory, entryPath);
      if (entry.isDirectory()) return listMarkdownFiles(entryPath);
      if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md") return [entryPath];
      return [];
    })
  );
  return files.flat();
}

function normalizeFrontmatter(value, id) {
  if (!isRecord(value)) {
    throw new ContentStoreError("INVALID_FRONTMATTER", "Frontmatter 必须是对象。", 400);
  }
  const next = { ...value, id };
  if (!valueAsString(next.title).trim()) {
    throw new ContentStoreError("MISSING_TITLE", "标题不能为空。", 400);
  }
  if (!valueAsString(next.summary).trim()) {
    throw new ContentStoreError("MISSING_SUMMARY", "摘要不能为空。", 400);
  }
  return next;
}

function createDraftInput(type, input) {
  const title = valueAsString(input?.title).trim();
  if (!title) {
    throw new ContentStoreError("MISSING_TITLE", "标题不能为空。", 400);
  }
  const id = assertContentId(createId(valueAsString(input?.id, title)));
  const summary = valueAsString(input?.summary, defaultSummary(type)).trim() || defaultSummary(type);
  const date = new Date().toISOString().slice(0, 10);
  const frontmatter = createDraftFrontmatter(type, {
    id,
    title,
    summary,
    date,
    meta: valueAsString(input?.meta),
    projectStage: valueAsString(input?.projectStage)
  });
  return {
    id,
    frontmatter,
    markdown: createDraftMarkdown(type, title)
  };
}

function createDraftFrontmatter(type, draft) {
  if (type === "docs") {
    const category = draft.meta.trim() || "Notes";
    return {
      id: draft.id,
      title: draft.title,
      status: "draft",
      category,
      tags: ["Embedded"],
      level: "beginner",
      createdAt: draft.date,
      updatedAt: draft.date,
      readingTime: "5 min",
      views: 0,
      summary: draft.summary,
      cover: `/images/docs/${draft.id}/cover.jpg`
    };
  }

  if (type === "projects") {
    const stack = splitList(draft.meta) || ["STM32", "FreeRTOS"];
    return {
      id: draft.id,
      title: draft.title,
      summary: draft.summary,
      stack,
      highlights: ["Highlight 1", "Highlight 2", "Highlight 3"],
      gallery: [`/images/projects/${draft.id}/cover.jpg`],
      links: [{ label: "GitHub", href: "#" }],
      role: "Embedded Developer",
      period: String(new Date().getFullYear()),
      status: "draft",
      projectStage: valueAsProjectStage(draft.projectStage || "building"),
      backgroundImage: "",
      backgroundPosition: "center",
      backgroundTone: "balanced"
    };
  }

  const tag = draft.meta.trim() || "Life";
  return {
    id: draft.id,
    title: draft.title,
    date: draft.date,
    tag,
    summary: draft.summary,
    cover: `/images/life/${draft.id}/cover.jpg`,
    mood: "quiet",
    status: "draft"
  };
}

function createDraftMarkdown(type, title) {
  if (type === "projects") {
    return `# ${title}

## Project Background

Explain why this project was built.

## Goals

Describe what the project is trying to solve.

## System Architecture

Add diagrams or module descriptions.

## Core Features

- Feature 1
- Feature 2
- Feature 3

## Challenges And Solutions

Record the difficult parts and how you solved them.

## Results

Add screenshots, photos, demos, or metrics.

## Retrospective

What worked, what remains, and what to improve next.
`;
  }

  if (type === "life") {
    return `# ${title}

## Moment

Write what happened.

## Photos

Add photos or visual notes here.

## Reflection

Write the feeling, observation, or takeaway.
`;
  }

  return `# ${title}

## Background

Explain why this document exists.

## Key Points

- Point 1
- Point 2
- Point 3

## Details

Write the main content here.
`;
}

async function createImageAssetDirectory(projectRoot, publicRoot, type, id) {
  const assetDirectory = path.resolve(publicRoot, "images", contentDirectories[type], id);
  assertInside(publicRoot, assetDirectory);
  await mkdir(assetDirectory, { recursive: true });
  const keepFile = path.resolve(assetDirectory, ".gitkeep");
  assertInside(assetDirectory, keepFile);
  try {
    await writeFile(keepFile, "", { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }
  assertInside(projectRoot, assetDirectory);
  return assetDirectory;
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function createId(value) {
  const normalized = valueAsString(value)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, 80) || `content-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

function splitList(value) {
  const items = valueAsString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

function defaultSummary(type) {
  if (type === "projects") return "Write a short project summary.";
  if (type === "life") return "Write a short summary for this post.";
  return "Write a short summary for this document.";
}

async function backupOriginalFile(backupRoot, type, id, filePath) {
  await mkdir(backupRoot, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const backupPath = path.resolve(backupRoot, `${timestamp}-${type}-${id}.md`);
  assertInside(backupRoot, backupPath);
  await copyFile(filePath, backupPath);
  return backupPath;
}

function toSummary(type, entry) {
  const data = entry.frontmatter;
  const id = valueAsString(data.id, entry.fileId);
  return {
    type,
    id,
    title: valueAsString(data.title, id),
    summary: valueAsString(data.summary),
    status: valueAsContentStatus(data.status),
    projectStage: type === "projects" ? valueAsProjectStage(data.projectStage) : null,
    category:
      type === "docs"
        ? valueAsString(data.category, "Uncategorized")
        : type === "projects"
          ? valueAsProjectStage(data.projectStage)
          : valueAsString(data.tag),
    tags: type === "docs" ? valueAsStringArray(data.tags) : valueAsStringArray(data.stack),
    updatedAt: valueAsString(data.updatedAt, valueAsString(data.date, entry.modifiedAt.slice(0, 10))),
    relativePath: entry.relativePath
  };
}

function toDetail(type, entry) {
  return {
    ...toSummary(type, entry),
    frontmatter: entry.frontmatter,
    markdown: entry.markdown,
    modifiedAt: entry.modifiedAt
  };
}

async function withContentLock(key, task) {
  const previous = writeLocks.get(key) ?? Promise.resolve();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const next = previous.catch(() => undefined).then(() => gate);
  writeLocks.set(key, next);

  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
    if (writeLocks.get(key) === next) writeLocks.delete(key);
  }
}

function assertInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ContentStoreError("PATH_OUTSIDE_CONTENT_ROOT", "请求路径超出内容目录。", 400);
  }
}

function statusRank(status) {
  if (status === "published") return 0;
  if (status === "draft") return 1;
  return 2;
}

function typeRank(type) {
  return contentTypes.indexOf(type);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
