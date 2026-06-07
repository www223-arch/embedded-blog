import { docSchema, type TechDoc } from "./schema";
import { idFromPath, loadMarkdownEntries, valueAsNumber, valueAsString, valueAsStringArray, type Frontmatter } from "./frontmatter";

const docModules = import.meta.glob<string>("../../docs-vitepress/docs/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw"
});

export const techDocs: TechDoc[] = loadMarkdownEntries<Frontmatter>(docModules, {
  level: "beginner",
  views: 0,
  readingTime: "5 min"
})
  .filter((entry) => !entry.path.endsWith("/index.md"))
  .map((entry) => {
    const data = entry.frontmatter;
    return docSchema.parse({
      id: valueAsString(data.id, idFromPath(entry.path)),
      title: valueAsString(data.title, "Untitled Document"),
      category: valueAsString(data.category, "Notes"),
      tags: valueAsStringArray(data.tags),
      level: valueAsString(data.level, "beginner"),
      createdAt: valueAsString(data.createdAt, valueAsString(data.updatedAt)),
      updatedAt: valueAsString(data.updatedAt),
      readingTime: valueAsString(data.readingTime, "5 min"),
      views: valueAsNumber(data.views),
      summary: valueAsString(data.summary, ""),
      markdown: entry.markdown
    });
  });
