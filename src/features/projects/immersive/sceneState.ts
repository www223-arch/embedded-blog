import type { ProjectChapter, ProjectChapterStatus } from "./types.ts";

export type SignalOrbitSceneState = {
  activeIndex: number;
  cameraTarget: readonly [number, number, number];
  lookTarget: readonly [number, number, number];
  signalColor: number;
  signalStrength: number;
  anchorColors: number[];
};

const statusColors: Record<ProjectChapterStatus, number> = {
  past: 0xe6b56c,
  current: 0x79e0bf,
  future: 0xb7a0ff,
  open: 0xb7a0ff,
  resolved: 0xe6b56c
};

export function createSignalOrbitState(chapters: ProjectChapter[], activeIndex: number): SignalOrbitSceneState {
  const lastIndex = Math.max(chapters.length - 1, 0);
  const safeIndex = Math.min(Math.max(activeIndex, 0), lastIndex);
  const chapter = chapters[safeIndex];
  const progress = lastIndex ? safeIndex / lastIndex : 0.5;
  const angle = (progress - 0.5) * 1.24;
  const status = chapter?.status ?? "current";

  return {
    activeIndex: safeIndex,
    cameraTarget: [Math.sin(angle) * 0.82, 0.28, 6.15 - safeIndex * 0.22],
    lookTarget: [Math.sin(angle) * 1.28, 0, -0.82],
    signalColor: statusColors[status],
    signalStrength: status === "current" ? 1 : status === "future" || status === "open" ? 0.78 : 0.62,
    anchorColors: chapters.map((item) => statusColors[item.status])
  };
}
