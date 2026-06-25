---
id: architecture-overview
title: Architecture Overview
category: System Design
tags:
  - Architecture
  - System Design
  - Frontend
  - Knowledge Base
level: intermediate
createdAt: '2026-04-01'
updatedAt: '2026-06-08'
readingTime: 8 min
views: 12
summary: 个人知识库、项目展示和趣味交互的前端架构说明，记录内容从 Markdown 到网页展示的完整链路。
status: published
---

# Architecture Overview

## 项目概述

这个站点不是单纯的作品集页面，而是一个面向长期维护的个人知识库：技术文档负责沉淀方法，项目页负责展示结果，生活页负责保留个人风格，趣味实验室和网页小宠物负责提供轻量互动。

当前实现采用 Vite + TypeScript 的静态站点结构，内容通过 Markdown 和 YAML 维护，再由前端加载、校验、渲染。这样的好处是更新门槛低：新增文档时只需要补一个 Markdown 文件；调整视觉时只需要改对应的页面或组件样式。

## 核心能力

- 技术文档与项目数据的 schema 校验
- 插件式 feature 注册（`register()`）
- 统一动效工具层（进入/悬浮）
- 文档详情页的文件导航、目录导航、阅读进度和图片预览
- 卡片预览层：先展开停留，再由用户决定进入详情或返回
- 趣味模块：宠物、Memory Flip、Reaction Test、纸角入口

## 内容流转

| 内容类型 | 源文件 | 网页入口 | 维护重点 |
| --- | --- | --- | --- |
| 技术文档 | `docs-vitepress/docs/*.md` | 技术文档 | 标题、分类、标签、正文结构 |
| 项目展示 | `docs-vitepress/projects/*.md` | 项目作品 | 摘要、技术栈、亮点、图片 |
| 个人分享 | `docs-vitepress/life/*.md` | 个人分享 | 日期、标签、封面、个人叙事 |
| 本地说明 | `docs/*.md` | 不接入网页 | 维护规范、需求沉淀、规划 |

> 判断一篇内容是否值得进入网页：它是否能帮助别人理解你的方法、能力、审美或个人风格。如果只是内部操作说明，更适合留在 `docs/` 本地目录。

## 技术栈

- Vite
- TypeScript
- GSAP
- Zod

## 渲染链路

1. `import.meta.glob` 读取 Markdown 原文。
2. `frontmatter.ts` 提取 frontmatter 和正文。
3. `schema.ts` 用 Zod 校验数据结构。
4. 列表页读取元数据生成卡片。
5. 详情页通过 `renderDocumentShell()` 生成文档工作区。
6. `bindDocumentShell()` 接入阅读进度、目录高亮、图片预览和进入动画。

## 交互原则

- 列表页负责快速扫描：卡片要能看出分类、难度、更新时间和摘要。
- 预览层负责缓冲：点击卡片后先展开，避免用户被突然带离列表。
- 详情页负责沉浸阅读：左侧切文档，右侧看目录，中间保持纸张感。
- 小互动只在合适时出现：它应当增强记忆点，而不是抢走阅读注意力。

## 后续方向

- 增加更多真实项目复盘和技术笔记。
- 给文档详情页补充 callout、表格、引用块等常用知识库排版。
- 让网页小宠物感知阅读进度、搜索结果和趣味实验室状态。
- 继续降低内容维护成本，让 Markdown 更新后能稳定实时预览。
