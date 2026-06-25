import {
  parseMarkdownSource,
  valueAsContentStatus,
  valueAsLinks,
  valueAsNumber,
  valueAsProjectStage,
  valueAsString,
  valueAsStringArray,
  type Frontmatter
} from "../content-core/frontmatter.ts";
import { shouldIncludeContent, type ContentVisibility } from "../content-core/model.ts";

export type MarkdownEntry<T extends Frontmatter = Frontmatter> = {
  frontmatter: T;
  markdown: string;
  path: string;
};

export { parseMarkdownSource as parseMarkdownFile };
export {
  valueAsContentStatus,
  valueAsLinks,
  valueAsNumber,
  valueAsProjectStage,
  valueAsString,
  valueAsStringArray
};
export type { Frontmatter };

export function loadMarkdownEntries<T extends Frontmatter>(
  modules: Record<string, string>,
  defaults: Partial<T> = {}
): Array<MarkdownEntry<T>> {
  const visibility: ContentVisibility = import.meta.env.PROD ? "production" : "preview";

  return Object.entries(modules)
    .map(([path, raw]) => {
      const { frontmatter, markdown } = parseMarkdownSource(raw);
      return {
        frontmatter: { ...defaults, ...frontmatter } as T,
        markdown,
        path
      };
    })
    .filter((entry) => shouldIncludeContent(valueAsContentStatus(entry.frontmatter.status), visibility))
    .sort((a, b) => valueAsString(a.frontmatter.id).localeCompare(valueAsString(b.frontmatter.id)));
}

export function idFromPath(path: string): string {
  return path.split(/[\\/]/).pop()?.replace(/\.md$/, "") ?? "untitled";
}
