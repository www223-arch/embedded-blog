export type MotorStoryStage = "assembled" | "exploding" | "handoff" | "timeline";

export type MotorStoryLabel = "front-cover" | "rotor" | "stator" | "encoder";

export type MotorStoryState = {
  progress: number;
  frameIndex: number;
  stage: MotorStoryStage;
  explodeProgress: number;
  timelineProgress: number;
  visibleLabels: MotorStoryLabel[];
};

const EXPLODE_START = 0.12;
const EXPLODE_END = 0.68;
const TIMELINE_START = 0.84;

export function createMotorStoryState(progress: number, frameCount: number): MotorStoryState {
  const normalized = clamp(progress, 0, 1);
  const explodeProgress = clamp((normalized - EXPLODE_START) / (EXPLODE_END - EXPLODE_START), 0, 1);
  const timelineProgress = clamp((normalized - EXPLODE_END) / (1 - EXPLODE_END), 0, 1);
  const labelThresholds: Array<[MotorStoryLabel, number]> = [
    ["front-cover", 0.2],
    ["rotor", 0.45],
    ["stator", 0.62],
    ["encoder", 0.78]
  ];

  return {
    progress: normalized,
    frameIndex: Math.round(normalized * Math.max(frameCount - 1, 0)),
    stage: normalized < EXPLODE_START
      ? "assembled"
      : normalized < EXPLODE_END
        ? "exploding"
        : normalized < TIMELINE_START
          ? "handoff"
          : "timeline",
    explodeProgress,
    timelineProgress,
    visibleLabels: labelThresholds.flatMap(([label, threshold]) => explodeProgress >= threshold ? [label] : [])
  };
}

export function getMotorStoryFrameWindow(index: number, frameCount: number, radius = 3): number[] {
  if (frameCount <= 0) return [];
  const center = Math.round(clamp(index, 0, frameCount - 1));
  const start = Math.max(center - Math.max(radius, 0), 0);
  const end = Math.min(center + Math.max(radius, 0), frameCount - 1);
  return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
}

export function getMotorTimelineReadProgress(
  timelineTop: number,
  timelineHeight: number,
  viewportHeight: number
): number {
  const readingLine = viewportHeight * 0.72;
  const readingDistance = Math.max(timelineHeight - viewportHeight * 0.48, 1);
  return clamp((readingLine - timelineTop) / readingDistance, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);
}
