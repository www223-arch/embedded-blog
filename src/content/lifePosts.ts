import { idFromPath, loadMarkdownEntries, valueAsString } from "./frontmatter";

export type LifePost = {
  id: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
  cover: string;
  markdown?: string;
};

const lifeModules = import.meta.glob<string>("../../docs-vitepress/life/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw"
});

export const lifePosts: LifePost[] = loadMarkdownEntries(lifeModules)
  .filter((entry) => !entry.path.endsWith("/index.md"))
  .map((entry) => {
    const data = entry.frontmatter;
    return {
      id: valueAsString(data.id, idFromPath(entry.path)),
      title: valueAsString(data.title, "Untitled Post"),
      date: valueAsString(data.date, ""),
      tag: valueAsString(data.tag, "Life"),
      summary: valueAsString(data.summary, ""),
      cover: valueAsString(data.cover, ""),
      markdown: entry.markdown
    };
  });
