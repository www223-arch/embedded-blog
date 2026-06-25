#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const CONTENT_TYPES = {
  docs: {
    label: "technical document",
    contentDir: path.join(rootDir, "docs-vitepress", "docs"),
    imageDir: path.join(rootDir, "public", "images", "docs"),
    template: createDocTemplate
  },
  projects: {
    label: "project",
    contentDir: path.join(rootDir, "docs-vitepress", "projects"),
    imageDir: path.join(rootDir, "public", "images", "projects"),
    template: createProjectTemplate
  },
  life: {
    label: "life post",
    contentDir: path.join(rootDir, "docs-vitepress", "life"),
    imageDir: path.join(rootDir, "public", "images", "life"),
    template: createLifeTemplate
  }
};

function main() {
  const [type, rawTitle, rawId] = process.argv.slice(2);
  const config = CONTENT_TYPES[type];

  if (!config) {
    showHelp();
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const title = rawTitle || defaultTitle(type);
  const id = createId(rawId || title);
  const mdPath = path.join(config.contentDir, `${id}.md`);
  const assetDir = path.join(config.imageDir, id);

  if (fs.existsSync(mdPath)) {
    console.error(`Cannot create ${config.label}: ${relative(mdPath)} already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(config.contentDir, { recursive: true });
  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(mdPath, config.template({ id, title, date }), "utf8");
  fs.writeFileSync(path.join(assetDir, ".gitkeep"), "", "utf8");

  console.log(`Created ${config.label}:`);
  console.log(`- ${relative(mdPath)}`);
  console.log(`- ${relative(assetDir)}`);
  console.log("");
  console.log("Next steps:");
  console.log("1. Edit the frontmatter and Markdown body.");
  console.log("2. Put images in the created image folder.");
  console.log("3. Run npm run check:content.");
  console.log("4. Preview with npm run dev.");
}

function showHelp() {
  console.log("Create a Markdown content draft.");
  console.log("");
  console.log("Usage:");
  console.log("  npm run add-card -- <docs|projects|life> \"Title\" [id]");
  console.log("");
  console.log("Examples:");
  console.log("  npm run add-card -- docs \"FreeRTOS Task Notes\"");
  console.log("  npm run add-card -- projects \"Smart Car\" smart-car");
  console.log("  npm run add-card -- life \"Desk Upgrade\" desk-upgrade");
}

function defaultTitle(type) {
  if (type === "docs") return "New Technical Document";
  if (type === "projects") return "New Project";
  return "New Life Post";
}

function createId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `content-${Date.now()}`;
}

function relative(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

function createDocTemplate({ id, title, date }) {
  return `---
id: ${id}
title: ${title}
category: Notes
tags:
  - Embedded
level: beginner
createdAt: '${date}'
updatedAt: '${date}'
readingTime: 5 min
views: 0
summary: Write a short summary for this document.
cover: /images/docs/${id}/cover.jpg
status: draft
---

# ${title}

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

function createProjectTemplate({ id, title }) {
  return `---
id: ${id}
title: ${title}
summary: Write a short project summary.
stack:
  - STM32
  - FreeRTOS
highlights:
  - Highlight 1
  - Highlight 2
  - Highlight 3
gallery:
  - /images/projects/${id}/cover.jpg
links:
  - label: GitHub
    href: '#'
role: Embedded Developer
period: '2026'
status: draft
projectStage: building
---

# ${title}

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

function createLifeTemplate({ id, title, date }) {
  return `---
id: ${id}
title: ${title}
date: '${date}'
tag: Life
summary: Write a short summary for this post.
cover: /images/life/${id}/cover.jpg
mood: quiet
status: draft
---

# ${title}

## Moment

Write what happened.

## Photos

Add photos or visual notes here.

## Reflection

Write the feeling, observation, or takeaway.
`;
}

main();
