---
id: example-nested
status: archived
projectStage: concept
title: 文档嵌套与引用示例
summary: 展示如何在文档中引用其他文档，以及如何使用目录结构
stack:
  - VitePress
  - Markdown
  - 文档管理
highlights:
  - 文档间的链接引用
  - 文档内目录导航
  - 左侧文件目录
gallery:
  - /Gateway - Orion - Artemis VI~medium.jpg
links:
  - label: 查看工业边缘网关
    href: '#project-detail/edge-gateway'
---

# 文档嵌套与引用示例

## 概述

本文档展示如何在你的博客中实现类似飞书的文档管理功能。

## 文档间引用

你可以在 Markdown 中使用链接来引用其他文档：

### 链接到项目文档：[工业边缘网关](#project-detail/edge-gateway)

链接到生活记录：[桌面升级](#life-detail/desk-upgrade)

链接到技术文档：[架构概述](#doc-detail/architecture-overview)

## 文档内目录

### 二级标题

这是一个二级标题的内容。

#### 三级标题

这是一个三级标题的内容，会出现在左侧的"页面目录"中。

## 如何添加新文档

1. 在 `docs-vitepress/` 对应的目录下创建新的 Markdown 文件
2. 添加 frontmatter（文档元数据）
3. 编写 Markdown 内容
4. 运行 `python scripts/generate_content.py` 生成数据
5. 刷新页面即可看到更新

## 支持的 frontmatter 字段

### 项目文档 (projects/)

```yaml
id: 文档ID
title: 文档标题
summary: 文档摘要
stack:
  - 技术栈1
  - 技术栈2
highlights:
  - 亮点1
  - 亮点2
gallery:
  - 图片路径
links:
  - label: 链接文字
    href: 链接地址
```

### 生活记录 (life/)

```yaml
id: 文档ID
title: 文档标题
date: 日期
tag: 标签
summary: 摘要
cover: 封面图片
```

### 技术文档 (docs/)

```yaml
id: 文档ID
title: 文档标题
category: 分类
tags:
  - 标签1
  - 标签2
level: beginner/intermediate/advanced
createdAt: 创建日期
updatedAt: 更新日期
readingTime: 阅读时间
views: 浏览次数
summary: 摘要
```
