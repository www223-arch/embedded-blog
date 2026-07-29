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

  if (motorLab) return renderMotorStoryProject(project, chapters, total);

  return `
    <section class="immersive-project" data-visual-preset="${escapeAttribute(project.visualPreset)}">
      <div class="immersive-project-scene" id="immersiveProjectScene" aria-hidden="true"></div>
      <header class="immersive-project-hero">
        <span class="immersive-project-kicker">Ongoing project</span>
        <p class="immersive-project-count"><b id="immersiveProjectIndex">01</b> / ${total}</p>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.summary)}</p>
        ${project.currentFocus ? `<div class="immersive-project-focus"><span>Current focus</span><strong>${escapeHtml(project.currentFocus)}</strong></div>` : ""}
      </header>
      <div class="immersive-project-layout">
        <nav class="immersive-project-rail" aria-label="Project trajectory">
          ${chapters.map((chapter, index) => renderRailItem(chapter, index === 0)).join("")}
        </nav>
        <div class="immersive-project-reader">
          ${chapters.map((chapter) => renderChapter(chapter, false)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderMotorStoryProject(project: ProjectItem, chapters: ProjectChapter[], total: string): string {
  return `
    <section class="immersive-project motor-lab-project" data-visual-preset="motor-lab" data-story-stage="assembled">
      <div class="immersive-project-scene" id="immersiveProjectScene" aria-hidden="true">
        <img class="motor-story-poster" src="${resolveAssetPath("/images/projects/motor-control/story/poster.webp")}" alt="">
      </div>
      <div class="motor-story-stage">
        <div class="motor-story-sticky">
          <header class="immersive-project-hero">
            <span class="immersive-project-kicker">Ongoing engineering project</span>
            <p class="immersive-project-count"><b id="immersiveProjectIndex">01</b> / ${total}</p>
            <h1>${escapeHtml(project.title)}</h1>
            <p>${escapeHtml(project.summary)}</p>
            ${project.currentFocus ? `<div class="immersive-project-focus"><span>Current focus</span><strong>${escapeHtml(project.currentFocus)}</strong></div>` : ""}
          </header>
          <div class="motor-story-labels" aria-hidden="true">
            <span data-story-label="front-cover">前端盖</span>
            <span data-story-label="rotor">转子与轴</span>
            <span data-story-label="stator">定子绕组</span>
            <span data-story-label="encoder">编码器</span>
          </div>
          <div class="motor-story-axis" aria-hidden="true"><span></span><strong>Project trajectory</strong></div>
          <p class="motor-story-scroll-cue"><span aria-hidden="true"></span>Scroll to disassemble</p>
          <div class="motor-story-handoff" aria-hidden="true">
            <span>From assembly</span><strong>to engineering evidence</strong>
          </div>
        </div>
      </div>
      <div class="motor-story-timeline immersive-project-layout">
        <div class="motor-story-track" aria-hidden="true"><span></span></div>
        <div class="immersive-project-reader">
          ${chapters.map((chapter) => renderChapter(chapter, true)).join("")}
        </div>
      </div>
    </section>
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

function renderChapter(chapter: ProjectChapter, motorStory: boolean): string {
  const body = renderMarkdownDocument(chapter.body).html;
  const evidence = chapter.media
    ? `<button class="immersive-project-evidence" type="button" id="evidence-${escapeAttribute(chapter.id)}" data-evidence-src="${escapeAttribute(chapter.media)}" data-evidence-title="${escapeAttribute(chapter.title)}">Open evidence</button>`
    : "";
  const documentLink = chapter.document && !motorStory
    ? `<a class="immersive-project-document" href="${getProjectDocumentRoute(chapter.document)}">Read report</a>`
    : "";
  const storyNode = motorStory ? renderMotorStoryNode(chapter) : "";

  return `
    <article class="immersive-project-chapter${motorStory ? " motor-story-chapter" : ""} status-${chapter.status}" id="${escapeAttribute(chapter.id)}" data-chapter-status="${chapter.status}">
      ${motorStory ? "" : `<div class="immersive-project-chapter-index">${chapter.railLabel}</div>`}
      ${storyNode}
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

function renderMotorStoryNode(chapter: ProjectChapter): string {
  const content = `<span>${chapter.railLabel}</span><b>${escapeHtml(chapter.title)}</b><small>${chapter.document ? "Read report" : "Project note"}</small>`;
  return chapter.document
    ? `<a class="motor-story-node immersive-project-document" href="${getProjectDocumentRoute(chapter.document)}" aria-label="Read report: ${escapeAttribute(chapter.title)}">${content}</a>`
    : `<div class="motor-story-node" aria-label="${escapeAttribute(chapter.title)}">${content}</div>`;
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

function resolveAssetPath(value: string): string {
  if (!value.startsWith("/")) return value;
  const env = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}${value}`;
}
