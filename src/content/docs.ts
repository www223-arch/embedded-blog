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
    markdown: "## Architecture Description\n\n### Layers\n\n- `src/app`: Application shell, hash routing, module registry.\n- `src/features`: Business modules (home/docs/projects/life/board/playground/pet).\n- `src/content`: Content layer (documents, projects, life sharing data).\n- `src/shared`: Common animation and interaction tools.\n- `src/store`: Game points and score status.\n\n### Extension Mechanism\n\nRegister new page modules through `src/app/moduleRegistry.ts` `register()`:\n\n1. Implement `render()`\n2. Optionally implement `afterMount()`\n3. Configure `visibleInNav` to control appearance in main navigation\n4. Register in `bootstrap.ts`\n\n### Routing and Navigation Principles\n\n- Main navigation only includes core information pages: `docs/projects/life/board`.\n- `playground` is a hidden route, only triggered through easter egg entry.\n- `home` serves as brand entry, not competing with business pages for attention.\n"
  },
] as const;

export const techDocs: TechDoc[] = docsRaw.map((item) => docSchema.parse(item));
