import type { ProjectItem } from "../../../content/schema";
import { buildProjectChapters } from "./view.ts";
import type { ImmersiveSceneController } from "./types.ts";
import { getMotorLabReadout, type MotorLabPart } from "./motorLabState.ts";
import { loadImmersiveScene } from "./sceneLoader.ts";

export function getActiveChapterIndex(ratios: number[]): number {
  return ratios.reduce((active, ratio, index) => (ratio > ratios[active] ? index : active), 0);
}

export function getEvidenceReturnTargetId(chapterId: string): string {
  return `evidence-${chapterId}`;
}

export function getChapterAriaCurrent(active: boolean): "step" | null {
  return active ? "step" : null;
}

export function mountImmersiveProjectExperience(root: HTMLElement, project: ProjectItem): () => void {
  const sceneHost = root.querySelector<HTMLElement>("#immersiveProjectScene");
  const reader = root.querySelector<HTMLElement>(".immersive-project-reader");
  const storyStage = root.querySelector<HTMLElement>(".motor-story-stage");
  const chapters = [...root.querySelectorAll<HTMLElement>(".immersive-project-chapter")];
  const railItems = [...root.querySelectorAll<HTMLButtonElement>(".immersive-project-rail-item")];
  const chapterRatios = chapters.map(() => 0);
  const indexLabel = root.querySelector<HTMLElement>("#immersiveProjectIndex");
  const diagnosticTrigger = root.querySelector<HTMLButtonElement>("[data-motor-diagnostic]");
  const diagnosticLabel = root.querySelector<HTMLElement>("[data-motor-command-label]");
  const modeLabel = root.querySelector<HTMLElement>("[data-motor-mode]");
  const partLabel = root.querySelector<HTMLElement>("[data-motor-part]");
  let sceneController: ImmersiveSceneController | undefined;
  let disposed = false;
  let activeIndex = 0;
  let diagnosticMode = false;
  let selectedPart: MotorLabPart = "assembly";
  let evidenceDialog: HTMLDialogElement | HTMLElement | undefined;
  let evidenceTrigger: HTMLButtonElement | undefined;
  let scrollFrame = 0;

  const updateStoryProgress = () => {
    scrollFrame = 0;
    if (!storyStage || !sceneController?.setProgress) return;
    const rect = storyStage.getBoundingClientRect();
    const distance = Math.max(storyStage.offsetHeight - window.innerHeight, 1);
    sceneController.setProgress(Math.min(Math.max(-rect.top / distance, 0), 1));
  };

  const handleStoryScroll = () => {
    if (!storyStage || scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateStoryProgress);
  };

  const updateActiveChapter = (index: number) => {
    activeIndex = Math.min(Math.max(index, 0), Math.max(chapters.length - 1, 0));
    railItems.forEach((item, itemIndex) => {
      const ariaCurrent = getChapterAriaCurrent(itemIndex === activeIndex);
      if (ariaCurrent) item.setAttribute("aria-current", ariaCurrent);
      else item.removeAttribute("aria-current");
    });
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

  const setDiagnosticMode = (active: boolean) => {
    diagnosticMode = active;
    if (active) selectedPart = "encoder";
    const readout = getMotorLabReadout(selectedPart, active);
    root.classList.toggle("motor-lab-diagnostic", active);
    diagnosticTrigger?.setAttribute("aria-pressed", String(active));
    diagnosticLabel?.replaceChildren(readout.commandLabel);
    modeLabel?.replaceChildren(readout.modeLabel);
    partLabel?.replaceChildren(readout.partLabel);
    sceneController?.setDiagnosticMode?.(active);
  };

  const handleDiagnosticClick = () => setDiagnosticMode(!diagnosticMode);

  const handlePartChange = (part: MotorLabPart) => {
    selectedPart = part;
    const readout = getMotorLabReadout(part, diagnosticMode);
    root.dataset.motorPart = part;
    partLabel?.replaceChildren(readout.partLabel);
  };

  chapters.forEach((chapter) => observer.observe(chapter));
  railItems.forEach((item) => item.addEventListener("click", handleRailClick));
  root.querySelectorAll<HTMLButtonElement>("[data-evidence-src]").forEach((trigger) => trigger.addEventListener("click", handleEvidenceClick));
  diagnosticTrigger?.addEventListener("click", handleDiagnosticClick);
  window.addEventListener("scroll", handleStoryScroll, { passive: true });
  window.addEventListener("resize", handleStoryScroll, { passive: true });
  updateActiveChapter(0);
  setDiagnosticMode(false);

  if (sceneHost && reader) {
    void loadImmersiveScene(project.visualPreset)
      .then((mountScene) => {
        if (disposed) return;
        sceneController = mountScene(sceneHost, buildProjectChapters(project), { onPartChange: handlePartChange });
        sceneController?.setActiveChapter(activeIndex);
        sceneController?.setDiagnosticMode?.(diagnosticMode);
        updateStoryProgress();
      })
      .catch((error) => console.warn("Immersive project scene failed to mount", error));
  }

  return () => {
    disposed = true;
    observer.disconnect();
    railItems.forEach((item) => item.removeEventListener("click", handleRailClick));
    root.querySelectorAll<HTMLButtonElement>("[data-evidence-src]").forEach((trigger) => trigger.removeEventListener("click", handleEvidenceClick));
    diagnosticTrigger?.removeEventListener("click", handleDiagnosticClick);
    window.removeEventListener("scroll", handleStoryScroll);
    window.removeEventListener("resize", handleStoryScroll);
    cancelAnimationFrame(scrollFrame);
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
