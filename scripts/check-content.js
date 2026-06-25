#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const CONTENT_STATUSES = new Set(["draft", "published", "archived"]);
const PROJECT_STAGES = new Set(["concept", "building", "completed", "maintained", "paused"]);

const CONTENT_SECTIONS = [
  {
    type: "docs",
    dir: path.join(rootDir, "docs-vitepress", "docs"),
    required: ["id", "title", "category", "tags", "level", "updatedAt", "summary", "status"]
  },
  {
    type: "projects",
    dir: path.join(rootDir, "docs-vitepress", "projects"),
    required: ["id", "title", "summary", "stack", "highlights", "gallery", "status", "projectStage"]
  },
  {
    type: "life",
    dir: path.join(rootDir, "docs-vitepress", "life"),
    required: ["id", "title", "date", "tag", "summary", "status"]
  }
];

const allIds = new Map();
const issues = [];
let checkedFiles = 0;

for (const section of CONTENT_SECTIONS) {
  for (const filePath of listMarkdownFiles(section.dir)) {
    if (path.basename(filePath) === "index.md") continue;
    checkedFiles += 1;
    checkMarkdownFile(section, filePath);
  }
}

if (issues.length) {
  console.log(`Content check found ${issues.length} issue(s) in ${checkedFiles} file(s):`);
  console.log("");
  issues.forEach((issue) => console.log(`- ${issue}`));
  process.exit(1);
}

console.log(`Content check passed for ${checkedFiles} file(s).`);

function checkMarkdownFile(section, filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const frontmatter = parseFrontmatter(content);
  const rel = relative(filePath);

  if (!frontmatter) {
    issues.push(`${rel}: missing frontmatter block`);
    return;
  }

  if (!CONTENT_STATUSES.has(frontmatter.status)) {
    issues.push(`${rel}: invalid status "${frontmatter.status ?? ""}"`);
  }

  if (section.type === "projects" && !PROJECT_STAGES.has(frontmatter.projectStage)) {
    issues.push(`${rel}: invalid projectStage "${frontmatter.projectStage ?? ""}"`);
  }

  for (const field of section.required) {
    if (!hasValue(frontmatter[field])) {
      issues.push(`${rel}: missing required field "${field}"`);
    }
  }

  if (frontmatter.id) {
    const prior = allIds.get(frontmatter.id);
    if (prior) {
      issues.push(`${rel}: duplicate id "${frontmatter.id}" also used by ${prior}`);
    } else {
      allIds.set(frontmatter.id, rel);
    }
  }

  for (const imagePath of collectImagePaths(frontmatter, content)) {
    if (!imagePath.startsWith("/")) continue;
    const diskPath = path.join(publicDir, imagePath.slice(1));
    if (!fs.existsSync(diskPath)) {
      issues.push(`${rel}: image not found "${imagePath}"`);
    }
  }

  for (const assetPath of collectRichAssetPaths(content)) {
    const diskPath = path.join(publicDir, assetPath.slice(1));
    if (!fs.existsSync(diskPath)) {
      issues.push(`${rel}: rich content asset not found "${assetPath}"`);
    }
  }
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(entryPath);
    if (entry.isFile() && entry.name.endsWith(".md")) return [entryPath];
    return [];
  });
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    const parsed = parseYaml(match[1]);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function collectImagePaths(frontmatter, content) {
  const paths = [];
  for (const key of ["cover", "gallery"]) {
    const value = frontmatter[key];
    if (Array.isArray(value)) paths.push(...value);
    if (typeof value === "string") paths.push(value);
  }

  const imageMatches = content.matchAll(/!\[[^\]]*]\(([^)]+)\)/g);
  for (const match of imageMatches) {
    paths.push(match[1]);
  }

  return paths.filter((value) => value && !value.startsWith("http"));
}

function collectRichAssetPaths(content) {
  const paths = [];
  const fences = content.matchAll(/```(video|gallery|demo)\s*\n([\s\S]*?)```/g);

  for (const [, type, source] of fences) {
    try {
      const data = parseYaml(source);
      if (!data || typeof data !== "object" || Array.isArray(data)) continue;
      if (type === "video") {
        paths.push(data.src, data.poster);
      } else if (type === "demo") {
        paths.push(data.src);
      } else if (Array.isArray(data.images)) {
        paths.push(...data.images.map((image) => image?.src));
      }
    } catch {
      // The renderer will show an inline error; validation reports missing metadata elsewhere.
    }
  }

  return paths.filter((value) => typeof value === "string" && value.startsWith("/"));
}

function relative(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}
