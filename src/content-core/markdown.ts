import MarkdownIt from "markdown-it";
import { parse as parseYaml } from "yaml";

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export type MarkdownRenderResult = {
  html: string;
  toc: TocItem[];
};

export type MarkdownRenderOptions = {
  resolveAssetPath?: (value: string) => string;
};

type RichBlockData = Record<string, unknown>;

export function renderMarkdown(markdown: string, options: MarkdownRenderOptions = {}): MarkdownRenderResult {
  const toc: TocItem[] = [];
  const slugCounts = new Map<string, number>();
  const resolveAssetPath = options.resolveAssetPath ?? ((value: string) => value);
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false
  });

  const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules);
  const defaultImage = md.renderer.rules.image?.bind(md.renderer.rules);
  const defaultLinkOpen = md.renderer.rules.link_open?.bind(md.renderer.rules);
  const defaultTableOpen = md.renderer.rules.table_open?.bind(md.renderer.rules);
  const defaultTableClose = md.renderer.rules.table_close?.bind(md.renderer.rules);

  md.renderer.rules.heading_open = (tokens, index) => {
    const token = tokens[index];
    const sourceLevel = Number(token.tag.slice(1));
    const level = Math.min(sourceLevel + 1, 4);
    const inline = tokens[index + 1];
    const text = inline?.content ?? "section";
    const id = createSlug(text, slugCounts);
    token.tag = `h${level}`;
    token.attrSet("id", id);
    if (level >= 2) toc.push({ id, text, level });
    return md.renderer.renderToken(tokens, index, {});
  };

  md.renderer.rules.heading_close = (tokens, index) => {
    const sourceLevel = Number(tokens[index].tag.slice(1));
    tokens[index].tag = `h${Math.min(sourceLevel + 1, 4)}`;
    return md.renderer.renderToken(tokens, index, {});
  };

  md.renderer.rules.image = (tokens, index, rendererOptions, env, self) => {
    const src = tokens[index].attrGet("src");
    if (src) tokens[index].attrSet("src", resolveAssetPath(src));
    tokens[index].attrSet("loading", "lazy");
    return defaultImage ? defaultImage(tokens, index, rendererOptions, env, self) : self.renderToken(tokens, index, rendererOptions);
  };

  md.renderer.rules.link_open = (tokens, index, rendererOptions, env, self) => {
    const href = tokens[index].attrGet("href") ?? "";
    if (href.startsWith("/")) tokens[index].attrSet("href", resolveAssetPath(href));
    if (/^https?:\/\//i.test(href)) {
      tokens[index].attrSet("target", "_blank");
      tokens[index].attrSet("rel", "noreferrer");
    }
    return defaultLinkOpen ? defaultLinkOpen(tokens, index, rendererOptions, env, self) : self.renderToken(tokens, index, rendererOptions);
  };

  md.renderer.rules.table_open = (tokens, index, rendererOptions, env, self) => {
    const table = defaultTableOpen
      ? defaultTableOpen(tokens, index, rendererOptions, env, self)
      : self.renderToken(tokens, index, rendererOptions);
    return `<div class="doc-table-wrap">${table}`;
  };

  md.renderer.rules.table_close = (tokens, index, rendererOptions, env, self) => {
    const table = defaultTableClose
      ? defaultTableClose(tokens, index, rendererOptions, env, self)
      : self.renderToken(tokens, index, rendererOptions);
    return `${table}</div>`;
  };

  md.renderer.rules.fence = (tokens, index, rendererOptions, env, self) => {
    const token = tokens[index];
    const language = token.info.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    if (language === "mermaid") return renderMermaidBlock(token.content);
    if (language === "video") return renderVideoBlock(parseRichBlock(token.content), resolveAssetPath);
    if (language === "gallery") return renderGalleryBlock(parseRichBlock(token.content), resolveAssetPath);
    if (language === "callout") return renderCalloutBlock(parseRichBlock(token.content));
    if (language === "demo") return renderDemoBlock(parseRichBlock(token.content), resolveAssetPath);

    const rendered = defaultFence
      ? defaultFence(tokens, index, rendererOptions, env, self)
      : `<pre><code>${md.utils.escapeHtml(token.content)}</code></pre>\n`;
    return `<div class="doc-code-block"><div class="doc-code-toolbar"><span>${escapeHtml(language || "text")}</span><button type="button" class="doc-code-copy">复制</button></div>${rendered}</div>`;
  };

  return {
    html: md.render(markdown.replace(/\r\n/g, "\n")),
    toc
  };
}

function parseRichBlock(source: string): RichBlockData {
  try {
    const parsed = parseYaml(source);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function renderMermaidBlock(source: string): string {
  return `<div class="doc-rich-block doc-mermaid" data-mermaid-source="${escapeAttribute(source.trim())}"><pre><code>${escapeHtml(source.trim())}</code></pre></div>`;
}

function renderVideoBlock(data: RichBlockData, resolveAssetPath: (value: string) => string): string {
  const src = localPath(data.src, "/videos/");
  if (!src) return renderRichBlockError("视频路径必须位于 /videos/ 下");
  const poster = localPath(data.poster, "/images/");
  const caption = stringValue(data.caption);
  const attributes = [
    "controls",
    booleanValue(data.autoplay) ? "autoplay" : "",
    booleanValue(data.loop) ? "loop" : "",
    booleanValue(data.muted) ? "muted" : "",
    poster ? `poster="${escapeAttribute(resolveAssetPath(poster))}"` : ""
  ]
    .filter(Boolean)
    .join(" ");
  return `<figure class="doc-rich-block doc-video"><video ${attributes} preload="metadata"><source src="${escapeAttribute(resolveAssetPath(src))}"></video>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

function renderGalleryBlock(data: RichBlockData, resolveAssetPath: (value: string) => string): string {
  const images = Array.isArray(data.images) ? data.images.filter(isRecord) : [];
  const columns = clampNumber(data.columns, 1, 4, 2);
  if (!images.length) return renderRichBlockError("画廊至少需要一张图片");

  const items = images
    .map((image) => {
      const src = localPath(image.src, "/images/");
      if (!src) return "";
      const alt = stringValue(image.alt);
      const caption = stringValue(image.caption);
      return `<figure><img src="${escapeAttribute(resolveAssetPath(src))}" alt="${escapeAttribute(alt)}" loading="lazy">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    })
    .filter(Boolean)
    .join("");
  return items ? `<div class="doc-rich-block doc-gallery" style="--gallery-columns: ${columns}">${items}</div>` : renderRichBlockError("画廊图片路径必须位于 /images/ 下");
}

function renderCalloutBlock(data: RichBlockData): string {
  const allowedTypes = ["note", "tip", "warning", "danger"] as const;
  const rawType = stringValue(data.type);
  const type = allowedTypes.includes(rawType as (typeof allowedTypes)[number]) ? rawType : "note";
  const title = stringValue(data.title);
  const content = stringValue(data.content);
  if (!content) return renderRichBlockError("提示块缺少 content");
  return `<aside class="doc-rich-block doc-callout callout-${type}">${title ? `<strong>${escapeHtml(title)}</strong>` : ""}<p>${escapeHtml(content)}</p></aside>`;
}

function renderDemoBlock(data: RichBlockData, resolveAssetPath: (value: string) => string): string {
  const src = localPath(data.src, "/demos/");
  if (!src) return renderRichBlockError("演示路径必须位于 /demos/ 下");
  const title = stringValue(data.title) || "Interactive demo";
  const height = clampNumber(data.height, 280, 900, 520);
  const allowFullscreen = booleanValue(data.allowFullscreen);
  return `<figure class="doc-rich-block doc-demo"><iframe src="${escapeAttribute(resolveAssetPath(src))}" title="${escapeAttribute(title)}" height="${height}" loading="lazy" sandbox="allow-scripts allow-same-origin" ${allowFullscreen ? "allowfullscreen" : ""}></iframe><figcaption>${escapeHtml(title)}</figcaption></figure>`;
}

function renderRichBlockError(message: string): string {
  return `<div class="doc-rich-block doc-rich-error" role="note">${escapeHtml(message)}</div>`;
}

function localPath(value: unknown, prefix: string): string {
  const path = stringValue(value);
  if (!path.startsWith(prefix) || path.includes("..") || path.includes("\\")) return "";
  return path;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(value: unknown): boolean {
  return value === true || value === "true";
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}

function createSlug(text: string, counts: Map<string, number>): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u4e00-\u9fa5-]/g, "")
      .replace(/^-+|-+$/g, "") || "section";
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
