import { createMotorStoryState, getMotorStoryFrameWindow } from "./motorStoryState.ts";
import type { ImmersiveSceneController, ProjectChapter } from "./types.ts";

const FRAME_COUNT = 80;
const MAX_CONCURRENT_LOADS = 4;

export function getMotorStoryFrameSrc(index: number): string {
  const frame = Math.min(Math.max(Math.round(index), 0), FRAME_COUNT - 1) + 1;
  return `/images/projects/motor-control/story/frame-${String(frame).padStart(4, "0")}.webp`;
}

export function mountMotorStorySequence(
  host: HTMLElement,
  _chapters: ProjectChapter[]
): ImmersiveSceneController | undefined {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    host.dataset.state = "unsupported";
    return undefined;
  }

  canvas.className = "immersive-project-canvas motor-story-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  host.dataset.state = "loading";
  host.dataset.scene = "motor-story";
  const storyRoot = host.closest<HTMLElement>(".motor-lab-project");

  const frames: Array<HTMLImageElement | null | undefined> = Array(FRAME_COUNT);
  const queued = new Set<number>();
  const queue: number[] = [];
  let activeLoads = 0;
  let requestedIndex = 0;
  let lastGoodFrame: HTMLImageElement | undefined;
  let disposed = false;

  const draw = () => {
    if (disposed) return;
    const image = frames[requestedIndex] || lastGoodFrame;
    if (!image) return;
    lastGoodFrame = image;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = host.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
    host.dataset.state = "ready";
  };

  const pumpQueue = () => {
    while (!disposed && activeLoads < MAX_CONCURRENT_LOADS && queue.length) {
      const index = queue.shift();
      if (index === undefined) break;
      activeLoads += 1;
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        activeLoads -= 1;
        frames[index] = image;
        if (index === requestedIndex || !lastGoodFrame) draw();
        pumpQueue();
      };
      image.onerror = () => {
        activeLoads -= 1;
        frames[index] = null;
        pumpQueue();
      };
      image.src = resolveAssetPath(getMotorStoryFrameSrc(index));
    }
  };

  const requestFrames = (indices: number[]) => {
    indices.forEach((index) => {
      if (frames[index] !== undefined || queued.has(index)) return;
      queued.add(index);
      queue.push(index);
    });
    pumpQueue();
  };

  const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(draw);
  const handleResize = () => draw();
  resizeObserver?.observe(host);
  if (!resizeObserver) window.addEventListener("resize", handleResize, { passive: true });
  requestFrames(getMotorStoryFrameWindow(0, FRAME_COUNT, 4));

  return {
    setActiveChapter() {},
    setProgress(progress) {
      const state = createMotorStoryState(progress, FRAME_COUNT);
      requestedIndex = state.frameIndex;
      host.dataset.storyStage = state.stage;
      host.style.setProperty("--motor-story-progress", state.progress.toFixed(4));
      host.style.setProperty("--motor-timeline-progress", state.timelineProgress.toFixed(4));
      if (storyRoot) {
        storyRoot.dataset.storyStage = state.stage;
        storyRoot.dataset.visibleLabels = state.visibleLabels.join(" ");
        storyRoot.style.setProperty("--motor-story-progress", state.progress.toFixed(4));
        storyRoot.style.setProperty("--motor-timeline-progress", state.timelineProgress.toFixed(4));
      }
      requestFrames(getMotorStoryFrameWindow(requestedIndex, FRAME_COUNT, 4));
      draw();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      queue.length = 0;
      queued.clear();
      canvas.remove();
      delete host.dataset.state;
      delete host.dataset.scene;
      delete host.dataset.storyStage;
      if (storyRoot) {
        delete storyRoot.dataset.storyStage;
        delete storyRoot.dataset.visibleLabels;
        storyRoot.style.removeProperty("--motor-story-progress");
        storyRoot.style.removeProperty("--motor-timeline-progress");
      }
    }
  };
}

function resolveAssetPath(value: string): string {
  if (!value.startsWith("/")) return value;
  const env = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}${value}`;
}
