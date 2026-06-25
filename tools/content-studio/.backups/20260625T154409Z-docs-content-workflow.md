---
id: content-workflow
title: 内容系统与维护工作流
category: Content System
tags:
  - Content
  - Workflow
  - Markdown
  - Knowledge Base
level: beginner
createdAt: 2026-06-08
updatedAt: 2026-06-08
readingTime: 7 min
views: 0
summary: 记录这个个人站的内容维护方式：如何新增文档、项目和生活笔记，以及如何保证网页风格统一、内容可持续沉淀。
status: published
---

# 内容系统与维护工作流

## 为什么要有内容系统

这个网站的目标不是一次性做完，而是持续沉淀。内容系统要解决三个问题：写起来方便、展示起来好看、长期更新时不乱。

技术文档、项目作品、个人分享都使用 Markdown 或 YAML 维护。这样既保留了写作效率，也能让网页用统一的卡片、详情页和动效呈现内容。

## 内容目录

| 板块 | 目录 | 适合内容 | 展示方式 |
| --- | --- | --- | --- |
| 技术文档 | `docs-vitepress/docs` | 架构说明、踩坑记录、技术笔记 | 知识库卡片 + 文档详情页 |
| 项目作品 | `docs-vitepress/projects` | 项目复盘、系统设计、成果展示 | 项目卡片 + 图片/亮点详情 |
| 个人分享 | `docs-vitepress/life` | 生活记录、学习节奏、审美偏好 | 分享卡片 + 图文详情 |
| 本地文档 | `docs` | 维护手册、规划、规范 | 不进入网页，仅本地参考 |

## 新增技术文档

新建 Markdown 文件，例如：

```text
docs-vitepress/docs/my-note.md
```

frontmatter 推荐保持完整：

```markdown
---
id: my-note
title: 文档标题
category: System Design
tags:
  - Architecture
  - Embedded
level: beginner
createdAt: '2026-06-08'
updatedAt: '2026-06-08'
readingTime: 5 min
views: 0
summary: 用一句话说明这篇文档为什么值得读。
---
```

正文建议按“结论、背景、方案、细节、后续”组织。卡片摘要只负责吸引进入，真正的经验沉淀放在正文里。

## 新增项目展示

项目文档放在：

```text
docs-vitepress/projects
```

项目内容建议包含：

- 项目背景：为什么做。
- 技术方案：用了什么架构和关键技术。
- 关键亮点：比普通 Demo 更值得看的部分。
- 图片素材：至少一张能说明成果的图片。
- 后续计划：还能继续迭代什么。

> 项目页更像作品展陈，技术细节可以保留，但第一屏要让人快速看懂价值。

## 新增个人分享

生活或个人风采类内容放在：

```text
docs-vitepress/life
```

这类内容不需要写成技术报告。更重要的是保留真实观察、学习节奏、审美偏好和个人表达。

## 图片路径

图片统一从 `public` 下读取，Markdown 里推荐这样写：

```markdown
![项目截图](/images/projects/motor-control/cover.svg)
```

构建时会自动适配 `/embedded-blog/` 的线上路径。不要在 Markdown 里手动写完整 GitHub Pages 地址。

## 发布检查

每次内容更新后，至少运行：

```bash
npm run check:content
npm run build
```

如果要同步到线上网页：

```bash
npm run sync:gh-pages
```

## 内容质量清单

- 标题能说明主题，不只写“记录”或“总结”。
- 摘要能说明价值，不重复标题。
- 每篇文档至少有两个二级标题，方便生成右侧目录。
- 项目至少有一张真实图片或结构图。
- 标签不要太多，优先保持 3 到 5 个。
- 本地维护说明放在 `docs/`，不要混进网页知识库。
