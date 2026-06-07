#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const CONTENT_SECTIONS = [
  {
    type: "docs",
    dir: path.join(rootDir, "docs-vitepress", "docs"),
    required: ["id", "title", "category", "tags", "level", "updatedAt", "summary"]
  },
  {
    type: "projects",
    dir: path.join(rootDir, "docs-vitepress", "projects"),
    required: ["id", "title", "summary", "stack", "highlights", "gallery"]
  },
  {
    type: "life",
    dir: path.join(rootDir, "docs-vitepress", "life"),
    required: ["id", "title", "date", "tag", "summary"]
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

  if (frontmatter.status === "archived") return;

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
  return parseSimpleYaml(match[1]);
}

function parseSimpleYaml(source) {
  const result = {};
  const lines = source.split(/\r?\n/);
  let currentKey = null;
  let currentObject = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentKey && Array.isArray(result[currentKey])) {
      const item = listItem[1];
      const objectPair = item.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (objectPair) {
        currentObject = { [objectPair[1]]: cleanValue(objectPair[2]) };
        result[currentKey].push(currentObject);
      } else {
        result[currentKey].push(cleanValue(item));
        currentObject = null;
      }
      continue;
    }

    const nestedPair = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/);
    if (nestedPair && currentObject) {
      currentObject[nestedPair[1]] = cleanValue(nestedPair[2]);
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;

    currentKey = pair[1];
    currentObject = null;
    const rawValue = pair[2].trim();
    result[currentKey] = rawValue ? cleanValue(rawValue) : [];
  }

  return result;
}

function cleanValue(value) {
  return value.replace(/^['"]|['"]$/g, "").trim();
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

function relative(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}
