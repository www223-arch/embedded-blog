import type { RouteKey } from "../app/types";

export type DocumentFile = {
  id: string;
  title: string;
  route: RouteKey;
  group?: string;
};

export type DocumentMeta = {
  label: string;
  value: string | number;
};

export type DocumentShellOptions = {
  eyebrow: string;
  title: string;
  summary?: string;
  markdown: string;
  files: DocumentFile[];
  currentId: string;
  metas?: DocumentMeta[];
  tags?: string[];
  heroImages?: string[];
  contentClass?: string;
};

type TocItem = {
  id: string;
  text: string;
  level: number;
};

const slugCounts = new Map<string, number>();

export function renderDocumentShell(options: DocumentShellOptions): string {
  const rendered = renderMarkdownDocument(options.markdown);
  const groupedFiles = groupFiles(options.files);

  return `
    <section class="doc-workspace">
      <aside class="doc-rail doc-file-rail" aria-label="Document files">
        <div class="doc-rail-header">
          <span class="doc-rail-kicker">${escapeHtml(options.eyebrow)}</span>
          <strong>Documents</strong>
        </div>
        <nav class="doc-file-list">
          ${groupedFiles
            .map(
              (group) => `
                <div class="doc-file-group">
                  <div class="doc-file-group-title">${escapeHtml(group.label)}</div>
                  ${group.items.map((file) => renderFileLink(file, options.currentId)).join("")}
                </div>
              `
            )
            .join("")}
        </nav>
      </aside>

      <article class="doc-paper ${options.contentClass ?? ""}">
        <header class="doc-paper-header">
          <div class="doc-paper-eyebrow">${escapeHtml(options.eyebrow)}</div>
          <h1>${escapeHtml(options.title)}</h1>
          ${options.summary ? `<p class="doc-paper-summary">${escapeHtml(options.summary)}</p>` : ""}
          ${options.metas?.length ? renderMeta(options.metas) : ""}
          ${options.tags?.length ? `<div class="doc-chip-row">${options.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        </header>
        ${options.heroImages?.length ? renderHeroImages(options.heroImages, options.title) : ""}
        <div class="doc-body">${rendered.html}</div>
      </article>

      <aside class="doc-rail doc-toc-rail" aria-label="Page outline">
        <div class="doc-rail-header">
          <span class="doc-rail-kicker">On This Page</span>
          <strong>Outline</strong>
        </div>
        ${renderToc(rendered.toc)}
      </aside>
    </section>
  `;
}

export function bindDocumentShell(): void {
  document.querySelectorAll<HTMLElement>(".doc-file-link").forEach((link) => {
    link.addEventListener("click", () => {
      const route = link.dataset.route as RouteKey | undefined;
      const id = link.dataset.id;
      if (!route || !id) return;
      window.location.hash = `${route}/${id}`;
    });
  });

  const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>(".doc-toc-link")];
  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.getAttribute("href")?.slice(1);
      document.getElementById(id ?? "")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const headings = [...document.querySelectorAll<HTMLElement>(".doc-body h2[id], .doc-body h3[id], .doc-body h4[id]")];
  if (!headings.length || !tocLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      const id = visible.target.id;
      tocLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
    },
    { rootMargin: "-96px 0px -65% 0px", threshold: 0.01 }
  );

  headings.forEach((heading) => observer.observe(heading));
}

export function renderMarkdownDocument(markdown: string): { html: string; toc: TocItem[] } {
  slugCounts.clear();
  const toc: TocItem[] = [];
  const body = markdown.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n?/, "");
  const blocks = body.split(/\n{2,}/);
  const html = blocks.map((block) => renderBlock(block.trim(), toc)).filter(Boolean).join("\n");
  return { html, toc };
}

function renderBlock(block: string, toc: TocItem[]): string {
  if (!block) return "";

  if (block.startsWith("```")) {
    const lines = block.split("\n");
    const language = lines[0].replace(/`/g, "").trim();
    const code = lines.slice(1, lines.at(-1)?.startsWith("```") ? -1 : undefined).join("\n");
    return `<pre><code class="language-${escapeAttribute(language)}">${escapeHtml(code)}</code></pre>`;
  }

  const heading = block.match(/^(#{1,4})\s+(.+)$/);
  if (heading) {
    const level = Math.min(heading[1].length + 1, 4);
    const text = stripInlineMarkdown(heading[2]);
    const id = createSlug(text);
    if (level >= 2) toc.push({ id, text, level });
    return `<h${level} id="${id}">${renderInline(heading[2])}</h${level}>`;
  }

  if (/^[-*]\s+/m.test(block)) {
    const items = block
      .split("\n")
      .filter((line) => /^[-*]\s+/.test(line))
      .map((line) => `<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }

  if (/^\d+\.\s+/m.test(block)) {
    const items = block
      .split("\n")
      .filter((line) => /^\d+\.\s+/.test(line))
      .map((line) => `<li>${renderInline(line.replace(/^\d+\.\s+/, ""))}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  }

  return `<p>${renderInline(block.replace(/\n/g, "<br>"))}</p>`;
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function stripInlineMarkdown(value: string): string {
  return value.replace(/[`*_]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
}

function createSlug(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/^-+|-+$/g, "") || "section";
  const count = slugCounts.get(base) ?? 0;
  slugCounts.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function groupFiles(files: DocumentFile[]): Array<{ label: string; items: DocumentFile[] }> {
  const groups = new Map<string, DocumentFile[]>();
  files.forEach((file) => {
    const label = file.group ?? "All";
    groups.set(label, [...(groups.get(label) ?? []), file]);
  });
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

function renderFileLink(file: DocumentFile, currentId: string): string {
  return `
    <button class="doc-file-link ${file.id === currentId ? "active" : ""}" data-route="${file.route}" data-id="${file.id}">
      <span class="doc-file-dot"></span>
      <span>${escapeHtml(file.title)}</span>
    </button>
  `;
}

function renderMeta(metas: DocumentMeta[]): string {
  return `<div class="doc-meta-row">${metas.map((meta) => `<span><b>${escapeHtml(meta.label)}</b>${escapeHtml(String(meta.value))}</span>`).join("")}</div>`;
}

function renderHeroImages(images: string[], title: string): string {
  return `
    <div class="doc-hero-media">
      ${images.map((image) => `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(title)}" loading="lazy">`).join("")}
    </div>
  `;
}

function renderToc(toc: TocItem[]): string {
  if (!toc.length) return `<p class="doc-toc-empty">No headings yet</p>`;
  return `
    <nav class="doc-toc-list">
      ${toc
        .map(
          (item) => `
            <a class="doc-toc-link level-${item.level}" href="#${escapeAttribute(item.id)}">
              ${escapeHtml(item.text)}
            </a>
          `
        )
        .join("")}
    </nav>
  `;
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
