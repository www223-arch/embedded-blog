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

export type DocumentInsight = {
  label: string;
  value: string | number;
  description?: string;
};

export type DocumentAction = {
  label: string;
  href: string;
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
  insights?: DocumentInsight[];
  actions?: DocumentAction[];
  contentClass?: string;
};

type TocItem = {
  id: string;
  text: string;
  level: number;
};

const slugCounts = new Map<string, number>();
let documentShellCleanup: Array<() => void> = [];

export function renderDocumentShell(options: DocumentShellOptions): string {
  const rendered = renderMarkdownDocument(options.markdown);
  const groupedFiles = groupFiles(options.files);
  const actions = (options.actions ?? []).filter((action) => action.href.trim() && action.href.trim() !== "#");
  const hasVisualStrip = Boolean(options.insights?.length || actions.length);

  return `
    <section class="doc-workspace">
      <div class="doc-progress" aria-hidden="true"><span></span></div>
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
          <div class="doc-paper-eyebrow"><span></span>${escapeHtml(options.eyebrow)}</div>
          <h1>${escapeHtml(options.title)}</h1>
          ${options.summary ? `<p class="doc-paper-summary">${escapeHtml(options.summary)}</p>` : ""}
          ${options.metas?.length ? renderMeta(options.metas) : ""}
          ${options.tags?.length ? `<div class="doc-chip-row">${options.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        </header>
        ${
          hasVisualStrip
            ? `<div class="doc-visual-strip">
                ${options.insights?.length ? renderInsights(options.insights) : ""}
                ${actions.length ? renderActions(actions) : ""}
              </div>`
            : ""
        }
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
  cleanupDocumentShell();
  animateDocumentShell();
  bindReadingProgress();
  bindImagePreview();

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
  documentShellCleanup.push(() => observer.disconnect());
}

function bindImagePreview(): void {
  document.querySelectorAll<HTMLImageElement>(".doc-paper img").forEach((image) => {
    image.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "doc-image-preview";
      overlay.innerHTML = `
        <button class="doc-image-preview-close" aria-label="Close preview">x</button>
        <img src="${escapeAttribute(image.currentSrc || image.src)}" alt="${escapeAttribute(image.alt)}">
      `;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("active"));

      const close = () => {
        overlay.classList.remove("active");
        setTimeout(() => overlay.remove(), 180);
      };

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || (event.target as HTMLElement).classList.contains("doc-image-preview-close")) close();
      });
      window.addEventListener("keydown", function handleEscape(event) {
        if (event.key !== "Escape") return;
        window.removeEventListener("keydown", handleEscape);
        close();
      });
    });
  });
}

function animateDocumentShell(): void {
  const items = document.querySelectorAll<HTMLElement>(".doc-rail, .doc-paper");
  items.forEach((item, index) => {
    item.style.setProperty("--doc-enter-delay", `${index * 70}ms`);
    item.classList.add("doc-enter");
  });
}

function bindReadingProgress(): void {
  const progress = document.querySelector<HTMLElement>(".doc-progress span");
  const paper = document.querySelector<HTMLElement>(".doc-paper");
  if (!progress || !paper) return;

  const update = () => {
    const rect = paper.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight * 0.72);
    const read = Math.min(scrollable, Math.max(0, -rect.top + 120));
    progress.style.transform = `scaleX(${read / scrollable})`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  documentShellCleanup.push(() => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  });
}

function cleanupDocumentShell(): void {
  documentShellCleanup.forEach((dispose) => dispose());
  documentShellCleanup = [];
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

  if (/^(-{3,}|\*{3,}|_{3,})$/.test(block)) {
    return "<hr>";
  }

  if (isTableBlock(block)) {
    return renderTable(block);
  }

  if (isBlockquote(block)) {
    return renderBlockquote(block);
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

function isTableBlock(block: string): boolean {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || !lines[0].includes("|")) return false;
  return isTableSeparator(lines[1]);
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(block: string): string {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const headers = splitTableRow(lines[0]);
  const rows = lines.slice(2).filter((line) => line.includes("|")).map(splitTableRow);

  return `
    <div class="doc-table-wrap">
      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${renderInline(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => `<tr>${headers.map((_header, index) => `<td>${renderInline(row[index] ?? "")}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function isBlockquote(block: string): boolean {
  return block.split("\n").every((line) => /^>\s?/.test(line.trim()) || !line.trim());
}

function renderBlockquote(block: string): string {
  const lines = block
    .split("\n")
    .map((line) => line.trim().replace(/^>\s?/, ""))
    .filter(Boolean);
  return `<blockquote>${lines.map(renderInline).join("<br>")}</blockquote>`;
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_match, alt: string, src: string) => `<img src="${escapeAttribute(resolveAssetPath(src))}" alt="${alt}" loading="lazy">`
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, label: string, href: string) =>
        `<a href="${escapeAttribute(resolveAssetPath(href))}" target="_blank" rel="noreferrer">${label}</a>`
    )
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
      <span class="doc-file-title">${escapeHtml(file.title)}</span>
    </button>
  `;
}

function renderMeta(metas: DocumentMeta[]): string {
  return `<div class="doc-meta-row">${metas.map((meta) => `<span><b>${escapeHtml(meta.label)}</b>${escapeHtml(String(meta.value))}</span>`).join("")}</div>`;
}

function renderInsights(insights: DocumentInsight[]): string {
  return `
    <div class="doc-insight-grid">
      ${insights
        .map(
          (insight) => `
            <div class="doc-insight-card">
              <span class="doc-insight-label">${escapeHtml(insight.label)}</span>
              <strong class="doc-insight-value">${escapeHtml(String(insight.value))}</strong>
              ${insight.description ? `<span class="doc-insight-description">${escapeHtml(insight.description)}</span>` : ""}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderActions(actions: DocumentAction[]): string {
  return `
    <div class="doc-action-row">
      ${actions
        .map((action) => {
          const isExternal = /^https?:\/\//.test(action.href);
          const href = resolveAssetPath(action.href);
          return `
            <a class="doc-action-link" href="${escapeAttribute(href)}" ${isExternal ? 'target="_blank" rel="noreferrer"' : ""}>
              <span>${escapeHtml(action.label)}</span>
              <b aria-hidden="true">-&gt;</b>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderHeroImages(images: string[], title: string): string {
  return `
    <div class="doc-hero-media">
      ${images.map((image) => `<img src="${escapeAttribute(resolveAssetPath(image))}" alt="${escapeAttribute(title)}" loading="lazy">`).join("")}
    </div>
  `;
}

function resolveAssetPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return trimmed;
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/" || trimmed.startsWith(base)) return trimmed;
  return `${base.replace(/\/$/, "")}${trimmed}`;
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
