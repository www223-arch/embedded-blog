# 内容维护指南

## 技术文档

编辑 `src/content/docs.ts`，字段必须符合：

- `id/title/category/tags/level/updatedAt/summary/markdown`

`level` 仅允许：

- `beginner`
- `intermediate`
- `advanced`

## 项目作品

编辑 `src/content/projects.ts`，字段：

- `id/title/summary/stack/highlights/gallery/links`

建议至少保证每个项目有一张封面图和 3 条亮点。

## 个人分享

编辑 `src/content/lifePosts.ts`：

- `id/title/date/tag/summary/cover`

建议单条摘要控制在 40-70 字，保证列表扫描效率。

## 留言板

留言数据结构在 `src/features/board/repo.ts`：

- `id/name/content/createdAt`

前端展示会转义 HTML，避免脚本注入。
