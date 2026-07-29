import MarkdownIt from "markdown-it";
import { parse as parseYaml } from "yaml";

export type NarrativeBlock =
  | {
      type: "milestone";
      date: string;
      title: string;
      status: "past" | "current" | "future";
      media: string;
      document?: string;
      body: string;
    }
  | {
      type: "question";
      title: string;
      state: "open" | "resolved";
      body: string;
    }
  | {
      type: "next";
      title: string;
      body: string;
    };

type NarrativeFence = {
  type: NarrativeBlock["type"];
  content: string;
  startLine: number;
  endLine: number;
};

const narrativeTypes = new Set<NarrativeBlock["type"]>(["milestone", "question", "next"]);

export function parseNarrativeBlocks(markdown: string): NarrativeBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const fences = getNarrativeFences(markdown);

  return fences.flatMap<NarrativeBlock>((fence, index) => {
    const bodyEnd = fences[index + 1]?.startLine ?? lines.length;
    const body = lines.slice(fence.endLine, bodyEnd).join("\n").trim();
    const data = parseNarrativeData(fence.content);
    if (!data) return [];

    if (fence.type === "milestone") {
      const title = stringValue(data.title);
      if (!title) return [];
      const document = documentId(data.document);
      return [
        {
          type: "milestone",
          date: stringValue(data.date),
          title,
          status: milestoneStatus(data.status),
          media: mediaPath(data.media),
          ...(document ? { document } : {}),
          body
        }
      ];
    }

    if (fence.type === "question") {
      const title = stringValue(data.title);
      if (!title) return [];
      return [{ type: "question", title, state: questionState(data.state), body }];
    }

    const title = stringValue(data.title);
    return title ? [{ type: "next", title, body }] : [];
  });
}

function getNarrativeFences(markdown: string): NarrativeFence[] {
  const tokens = new MarkdownIt().parse(markdown.replace(/\r\n/g, "\n"), {});
  return tokens.flatMap((token) => {
    if (token.type !== "fence" || !token.map) return [];
    const type = token.info.trim().split(/\s+/)[0]?.toLowerCase();
    if (!type || !narrativeTypes.has(type as NarrativeBlock["type"])) return [];
    return [
      {
        type: type as NarrativeBlock["type"],
        content: token.content,
        startLine: token.map[0],
        endLine: token.map[1]
      }
    ];
  });
}

function parseNarrativeData(source: string): Record<string, unknown> | null {
  try {
    const parsed = parseYaml(source);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function milestoneStatus(value: unknown): "past" | "current" | "future" {
  return value === "current" || value === "future" ? value : "past";
}

function questionState(value: unknown): "open" | "resolved" {
  return value === "resolved" ? value : "open";
}

function mediaPath(value: unknown): string {
  const path = stringValue(value);
  if (!path.startsWith("/images/") && !path.startsWith("/videos/")) return "";
  if (path.includes("..") || path.includes("\\")) return "";
  return path;
}

function documentId(value: unknown): string {
  const id = stringValue(value);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? id : "";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
