import { projectSchema, type ProjectItem } from "./schema";
import { parseNarrativeBlocks } from "../content-core/narrative.ts";
import {
  idFromPath,
  loadMarkdownEntries,
  valueAsContentStatus,
  valueAsLinks,
  valueAsProjectStage,
  valueAsString,
  valueAsStringArray
} from "./frontmatter";

const projectModules = import.meta.glob<string>("../../docs-vitepress/projects/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw"
});

export const projectItems: ProjectItem[] = loadMarkdownEntries(projectModules)
  .filter((entry) => !entry.path.endsWith("/index.md"))
  .map((entry) => {
    const data = entry.frontmatter;
    return projectSchema.parse({
      id: valueAsString(data.id, idFromPath(entry.path)),
      title: valueAsString(data.title, "Untitled Project"),
      summary: valueAsString(data.summary, ""),
      stack: valueAsStringArray(data.stack),
      highlights: valueAsStringArray(data.highlights),
      gallery: valueAsStringArray(data.gallery),
      links: valueAsLinks(data.links),
      status: valueAsContentStatus(data.status),
      projectStage: valueAsProjectStage(data.projectStage),
      presentation: valueAsString(data.presentation),
      narrative: valueAsString(data.narrative),
      visualPreset: valueAsString(data.visualPreset),
      updatedAt: valueAsString(data.updatedAt),
      currentFocus: valueAsString(data.currentFocus),
      narrativeBlocks: parseNarrativeBlocks(entry.markdown),
      markdown: entry.markdown
    });
  });
