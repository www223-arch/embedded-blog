export type MotorLabPart = "assembly" | "rotor" | "encoder" | "phases";

export type MotorLabState = {
  activeIndex: number;
  diagnostic: boolean;
  selectedPart: MotorLabPart;
  cameraZ: number;
  housingOpacity: number;
  rippleStrength: number;
};

const DEFAULT_DRAG_THRESHOLD = 6;

export function createMotorLabState(
  chapterCount: number,
  activeIndex: number,
  diagnostic: boolean,
  selectedPart: MotorLabPart = "assembly"
): MotorLabState {
  const lastIndex = Math.max(chapterCount - 1, 0);
  const safeIndex = Math.min(Math.max(activeIndex, 0), lastIndex);

  return {
    activeIndex: safeIndex,
    diagnostic,
    selectedPart,
    cameraZ: diagnostic ? 4.35 : 5.6,
    housingOpacity: diagnostic ? 0.18 : 0.72,
    rippleStrength: diagnostic ? 0.92 : 0.2
  };
}

export function isPointerDrag(distanceSquared: number, threshold = DEFAULT_DRAG_THRESHOLD): boolean {
  return distanceSquared > threshold * threshold;
}
