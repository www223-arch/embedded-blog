import { docSchema, type TechDoc } from "./schema";

const docsRaw = [
  {
    id: "architecture-overview",
    title: "Architecture Overview",
    category: "System Design",
    tags: ["Architecture", "System Design", "Frontend"],
    level: "beginner",
    createdAt: "2026-04-01",
    updatedAt: "2026-04-01",
    readingTime: "10 min",
    views: 0,
    summary: "Overview of the embedded blog architecture and extension mechanism.",
    markdown: "# Architecture Overview\n\n## 项目概述\n\nOverview of the embedded blog architecture and extension mechanism.\n\n## 核心能力\n\n- 技术文档与项目数据的 schema 校验\n- 插件式 feature 注册（`register()`）\n- 统一动效工具层（进入/悬浮）\n- 趣味模块（宠物 + Memory Flip + Reaction Test）\n\n## 技术栈\n\n- Vite\n- TypeScript\n- GSAP\n- Zod\n"
  },
] as const;

export const techDocs: TechDoc[] = docsRaw.map((item) => docSchema.parse(item));
