import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { isContentStatus, isProjectStage, type ContentStatus, type ProjectStage } from "./model.ts";

export type Frontmatter = Record<string, unknown>;

export type ParsedMarkdownSource = {
  frontmatter: Frontmatter;
  markdown: string;
};

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/;

export function parseMarkdownSource(raw: string): ParsedMarkdownSource {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(FRONTMATTER_PATTERN);
  if (!match) return { frontmatter: {}, markdown: normalized };

  const parsed = parseYaml(match[1] ?? "");
  return {
    frontmatter: isRecord(parsed) ? parsed : {},
    markdown: normalized.slice(match[0].length)
  };
}

export function stringifyMarkdownSource(frontmatter: Frontmatter, markdown: string): string {
  const yaml = stringifyYaml(frontmatter, {
    lineWidth: 0,
    defaultStringType: "PLAIN",
    defaultKeyType: "PLAIN"
  }).trimEnd();
  const body = markdown.replace(/^\s+/, "").replace(/\s+$/, "");
  return `---\n${yaml}\n---\n\n${body}\n`;
}

export function valueAsString(value: unknown, fallback = ""): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return fallback;
}

export function valueAsNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

export function valueAsStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function valueAsLinks(value: unknown): Array<{ label: string; href: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = valueAsString(item.label, "Link");
    const href = valueAsString(item.href, "#");
    return [{ label, href }];
  });
}

export function valueAsContentStatus(value: unknown, fallback: ContentStatus = "published"): ContentStatus {
  return isContentStatus(value) ? value : fallback;
}

export function valueAsProjectStage(value: unknown, fallback: ProjectStage = "completed"): ProjectStage {
  return isProjectStage(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
