import type { RouteKey } from "../app/types";
import { renderMarkdown, type TocItem } from "../content-core/markdown.ts";

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
  bindCodeCopy();

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

function bindCodeCopy(): void {
  document.querySelectorAll<HTMLButtonElement>(".doc-code-copy").forEach((button) => {
    button.addEventListener("click", async () => {
      const codeElement = button.closest(".doc-code-block")?.querySelector("code");
      const code = codeElement?.textContent;
      if (!codeElement || !code) return;

      try {
        const copied = await copyText(code);
        if (!copied) selectCode(codeElement);
        const originalLabel = button.textContent;
        button.textContent = copied ? "已复制" : "已选中";
        window.setTimeout(() => {
          button.textContent = originalLabel;
        }, 1400);
      } catch {
        button.textContent = "复制失败";
      }
    });
  });
}

async function copyText(value: string): Promise<boolean> {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (copied) return true;

  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function selectCode(code: Element): void {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(code);
  selection.removeAllRanges();
  selection.addRange(range);
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
  return renderMarkdown(markdown, { resolveAssetPath });
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
