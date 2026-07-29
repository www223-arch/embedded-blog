import type { ProjectItem } from "../../../content/schema";
import { renderMarkdownDocument } from "../../../shared/documentView.ts";
import type { ProjectChapter, ProjectChapterStatus } from "./types";

export function buildProjectChapters(project: ProjectItem): ProjectChapter[] {
  if (!project.narrativeBlocks.length) {
    return [{
      id: "chapter-overview",
      railLabel: "01",
      eyebrow: "PROJECT OVERVIEW",
      title: project.title,
      body: project.summary,
      status: "current",
      media: ""
    }];
  }

  return project.narrativeBlocks.map((block, index) => {
    const railLabel = String(index + 1).padStart(2, "0");
    if (block.type === "milestone") {
      return {
        id: `chapter-${railLabel}`,
        railLabel,
        eyebrow: block.date || "PROJECT STAGE",
        title: block.title,
        body: block.body,
        status: block.status,
        media: block.media,
        document: block.document
      };
    }

    if (block.type === "question") {
      return {
        id: `chapter-${railLabel}`,
        railLabel,
        eyebrow: block.state === "open" ? "OPEN QUESTION" : "RESOLVED QUESTION",
        title: block.title,
        body: block.body,
        status: block.state,
        media: ""
      };
    }

    return {
      id: `chapter-${railLabel}`,
      railLabel,
      eyebrow: "NEXT TRAJECTORY",
      title: block.title,
      body: block.body,
      status: "future",
      media: ""
    };
  });
}

export function getProjectDocumentRoute(documentId: string): string {
  return `#doc-detail/${encodeURIComponent(documentId)}`;
}

export function isMotorLabPreset(project: Pick<ProjectItem, "visualPreset">): boolean {
  return project.visualPreset === "motor-lab";
}

export function renderImmersiveProject(project: ProjectItem): string {
  const chapters = buildProjectChapters(project);
  const total = String(chapters.length).padStart(2, "0");
  const motorLab = isMotorLabPreset(project);

  return `
    <section class="immersive-project${motorLab ? " motor-lab-project" : ""}" data-visual-preset="${escapeAttribute(project.visualPreset)}">
      <div class="immersive-project-scene" id="immersiveProjectScene" aria-hidden="true"></div>
      <header class="immersive-project-hero">
        <span class="immersive-project-kicker">Ongoing project</span>
        <p class="immersive-project-count"><b id="immersiveProjectIndex">01</b> / ${total}</p>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.summary)}</p>
        ${project.currentFocus ? `<div class="immersive-project-focus"><span>Current focus</span><strong>${escapeHtml(project.currentFocus)}</strong></div>` : ""}
        ${motorLab ? renderMotorLabControls(project) : ""}
      </header>
      <div class="immersive-project-layout">
        <nav class="immersive-project-rail" aria-label="Project trajectory">
          ${chapters.map((chapter, index) => renderRailItem(chapter, index === 0)).join("")}
        </nav>
        <div class="immersive-project-reader">
          ${chapters.map(renderChapter).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderMotorLabControls(project: ProjectItem): string {
  const fallback = project.gallery[0]
    ? `<img class="motor-lab-fallback" src="${escapeAttribute(project.gallery[0])}" alt="${escapeAttribute(project.title)} 项目封面">`
    : "";

  return `
    <div class="motor-lab-console">
      <button class="motor-lab-command" type="button" data-motor-diagnostic aria-pressed="false">
        <span class="motor-lab-command-mark" aria-hidden="true"></span>
        <span data-motor-command-label>点亮当前实验</span>
      </button>
      <p class="motor-lab-hint">拖动电机观察 · 点击部件识别</p>
      <div class="motor-lab-readout" role="status" aria-live="polite">
        <span data-motor-mode>观察模式</span>
        <strong data-motor-part>整机装配</strong>
        <small>${escapeHtml(project.currentFocus || "等待新的实验记录")}</small>
      </div>
      ${fallback}
    </div>
  `;
}

function renderRailItem(chapter: ProjectChapter, active: boolean): string {
  return `
    <button class="immersive-project-rail-item" type="button" data-chapter-target="${escapeAttribute(chapter.id)}" ${active ? 'aria-current="step"' : ""}>
      <span>${chapter.railLabel}</span>
      <b>${escapeHtml(chapter.title)}</b>
    </button>
  `;
}

function renderChapter(chapter: ProjectChapter): string {
  const body = renderMarkdownDocument(chapter.body).html;
  const evidence = chapter.media
    ? `<button class="immersive-project-evidence" type="button" id="evidence-${escapeAttribute(chapter.id)}" data-evidence-src="${escapeAttribute(chapter.media)}" data-evidence-title="${escapeAttribute(chapter.title)}">Open evidence</button>`
    : "";
  const documentLink = chapter.document
    ? `<a class="immersive-project-document" href="${getProjectDocumentRoute(chapter.document)}">Read report</a>`
    : "";

  return `
    <article class="immersive-project-chapter status-${chapter.status}" id="${escapeAttribute(chapter.id)}" data-chapter-status="${chapter.status}">
      <div class="immersive-project-chapter-index">${chapter.railLabel}</div>
      <div class="immersive-project-chapter-copy">
        <span class="immersive-project-status">${getStatusLabel(chapter.status)}</span>
        <p class="immersive-project-eyebrow">${escapeHtml(chapter.eyebrow)}</p>
        <h2>${escapeHtml(chapter.title)}</h2>
        <div class="immersive-project-body">${body}</div>
        ${evidence}
        ${documentLink}
      </div>
    </article>
  `;
}

function getStatusLabel(status: ProjectChapterStatus): string {
  const labels: Record<ProjectChapterStatus, string> = {
    past: "Settled",
    current: "In progress",
    future: "Next",
    open: "Open question",
    resolved: "Resolved"
  };
  return labels[status];
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
