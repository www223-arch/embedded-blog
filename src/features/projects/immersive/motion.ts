import type { ProjectItem } from "../../../content/schema";
import { buildProjectChapters } from "./view.ts";

export function getActiveChapterIndex(ratios: number[]): number {
  return ratios.reduce((active, ratio, index) => (ratio > ratios[active] ? index : active), 0);
}

export function getEvidenceReturnTargetId(chapterId: string): string {
  return `evidence-${chapterId}`;
}

export function mountImmersiveProjectExperience(root: HTMLElement, project: ProjectItem): () => void {
  const sceneHost = root.querySelector<HTMLElement>("#immersiveProjectScene");
  const reader = root.querySelector<HTMLElement>(".immersive-project-reader");
  const chapters = [...root.querySelectorAll<HTMLElement>(".immersive-project-chapter")];
  const railItems = [...root.querySelectorAll<HTMLButtonElement>(".immersive-project-rail-item")];
  const chapterRatios = chapters.map(() => 0);
  const indexLabel = root.querySelector<HTMLElement>("#immersiveProjectIndex");
  let sceneController: { setActiveChapter(index: number): void; dispose(): void } | undefined;
  let disposed = false;
  let activeIndex = 0;
  let evidenceDialog: HTMLDialogElement | HTMLElement | undefined;
  let evidenceTrigger: HTMLButtonElement | undefined;

  const updateActiveChapter = (index: number) => {
    activeIndex = Math.min(Math.max(index, 0), Math.max(chapters.length - 1, 0));
    railItems.forEach((item, itemIndex) => item.toggleAttribute("aria-current", itemIndex === activeIndex));
    indexLabel?.replaceChildren(String(activeIndex + 1).padStart(2, "0"));
    sceneController?.setActiveChapter(activeIndex);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = chapters.indexOf(entry.target as HTMLElement);
        if (index >= 0) chapterRatios[index] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      updateActiveChapter(getActiveChapterIndex(chapterRatios));
    },
    { root: null, rootMargin: "-22% 0px -45% 0px", threshold: [0.1, 0.35, 0.6] }
  );

  const handleRailClick = (event: Event) => {
    const target = event.currentTarget as HTMLButtonElement;
    const id = target.dataset.chapterTarget;
    if (!id) return;
    root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const closeEvidence = () => {
    if (!evidenceDialog) return;
    if (evidenceDialog instanceof HTMLDialogElement && evidenceDialog.open) evidenceDialog.close();
    evidenceDialog.remove();
    evidenceDialog = undefined;
    evidenceTrigger?.focus();
    evidenceTrigger = undefined;
  };

  const handleEvidenceClick = (event: Event) => {
    const trigger = event.currentTarget as HTMLButtonElement;
    const src = trigger.dataset.evidenceSrc;
    if (!src) return;
    closeEvidence();
    evidenceTrigger = trigger;
    evidenceDialog = createEvidenceDialog(src, trigger.dataset.evidenceTitle || "Evidence", closeEvidence);
    document.body.appendChild(evidenceDialog);
    if (evidenceDialog instanceof HTMLDialogElement) evidenceDialog.showModal();
    else evidenceDialog.classList.add("open");
  };

  chapters.forEach((chapter) => observer.observe(chapter));
  railItems.forEach((item) => item.addEventListener("click", handleRailClick));
  root.querySelectorAll<HTMLButtonElement>("[data-evidence-src]").forEach((trigger) => trigger.addEventListener("click", handleEvidenceClick));
  updateActiveChapter(0);

  if (sceneHost && reader) {
    void import("./scene.ts")
      .then(({ mountSignalOrbitScene }) => {
        if (disposed) return;
        sceneController = mountSignalOrbitScene(sceneHost, buildProjectChapters(project));
        sceneController?.setActiveChapter(activeIndex);
      })
      .catch((error) => console.warn("Immersive project scene failed to mount", error));
  }

  return () => {
    disposed = true;
    observer.disconnect();
    railItems.forEach((item) => item.removeEventListener("click", handleRailClick));
    root.querySelectorAll<HTMLButtonElement>("[data-evidence-src]").forEach((trigger) => trigger.removeEventListener("click", handleEvidenceClick));
    closeEvidence();
    sceneController?.dispose();
  };
}

function createEvidenceDialog(src: string, title: string, close: () => void): HTMLDialogElement | HTMLElement {
  const supportsDialog = typeof HTMLDialogElement !== "undefined";
  const dialog = supportsDialog ? document.createElement("dialog") : document.createElement("section");
  dialog.className = "immersive-project-evidence-dialog";
  if (!supportsDialog) {
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
  }

  const panel = document.createElement("div");
  panel.className = "immersive-project-evidence-panel";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const media = createEvidenceMedia(src, title);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "immersive-project-evidence-close";
  closeButton.textContent = "Close evidence";
  closeButton.addEventListener("click", close);

  panel.append(heading, media, closeButton);
  dialog.appendChild(panel);
  if (dialog instanceof HTMLDialogElement) dialog.addEventListener("close", close, { once: true });
  else dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
  return dialog;
}

function createEvidenceMedia(src: string, title: string): HTMLElement {
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(src)) {
    const video = document.createElement("video");
    video.controls = true;
    video.src = src;
    return video;
  }
  const image = document.createElement("img");
  image.src = src;
  image.alt = title;
  return image;
}
