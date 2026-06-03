import { docSchema, type TechDoc } from "./schema";
import architectureOverview from "../../docs-vitepress/docs/architecture-overview.md?raw";

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
    markdown: architectureOverview
  }
] as const;

export const techDocs: TechDoc[] = docsRaw.map((item) => docSchema.parse(item));
