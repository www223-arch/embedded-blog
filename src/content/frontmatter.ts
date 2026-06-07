export type FrontmatterValue = string | number | string[] | Array<Record<string, string>>;
export type Frontmatter = Record<string, FrontmatterValue>;

export type MarkdownEntry<T extends Frontmatter = Frontmatter> = {
  frontmatter: T;
  markdown: string;
  path: string;
};

export function loadMarkdownEntries<T extends Frontmatter>(
  modules: Record<string, string>,
  defaults: Partial<T> = {}
): Array<MarkdownEntry<T>> {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { frontmatter, markdown } = parseMarkdownFile(raw);
      return {
        frontmatter: { ...defaults, ...frontmatter } as T,
        markdown,
        path
      };
    })
    .filter((entry) => entry.frontmatter.status !== "archived")
    .sort((a, b) => String(a.frontmatter.id).localeCompare(String(b.frontmatter.id)));
}

export function parseMarkdownFile(raw: string): { frontmatter: Frontmatter; markdown: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, markdown: normalized };

  return {
    frontmatter: parseSimpleYaml(match[1]),
    markdown: normalized.slice(match[0].length)
  };
}

export function valueAsString(value: FrontmatterValue | undefined, fallback = ""): string {
  if (Array.isArray(value)) return fallback;
  if (value === undefined) return fallback;
  return String(value);
}

export function valueAsNumber(value: FrontmatterValue | undefined, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

export function valueAsStringArray(value: FrontmatterValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function valueAsLinks(value: FrontmatterValue | undefined): Array<{ label: string; href: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, string> => typeof item === "object" && item !== null && !Array.isArray(item))
    .map((item) => ({
      label: item.label ?? "Link",
      href: item.href ?? "#"
    }));
}

export function idFromPath(path: string): string {
  return path.split(/[\\/]/).pop()?.replace(/\.md$/, "") ?? "untitled";
}

function parseSimpleYaml(source: string): Frontmatter {
  const result: Frontmatter = {};
  const lines = source.split("\n");
  let currentKey: string | null = null;
  let currentObject: Record<string, string> | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentKey && Array.isArray(result[currentKey])) {
      const item = listItem[1];
      const objectPair = item.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (objectPair) {
        currentObject = { [objectPair[1]]: cleanValue(objectPair[2]) };
        (result[currentKey] as Array<Record<string, string>>).push(currentObject);
      } else {
        (result[currentKey] as string[]).push(cleanValue(item));
        currentObject = null;
      }
      continue;
    }

    const nestedPair = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/);
    if (nestedPair && currentObject) {
      currentObject[nestedPair[1]] = cleanValue(nestedPair[2]);
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;

    currentKey = pair[1];
    currentObject = null;
    const rawValue = pair[2].trim();
    result[currentKey] = rawValue ? normalizeValue(rawValue) : [];
  }

  return result;
}

function normalizeValue(value: string): string | number {
  const cleaned = cleanValue(value);
  const numeric = Number(cleaned);
  return cleaned !== "" && Number.isFinite(numeric) && String(numeric) === cleaned ? numeric : cleaned;
}

function cleanValue(value: string): string {
  return value.replace(/^['"]|['"]$/g, "").trim();
}
