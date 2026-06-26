export type SpaceFieldInput = {
  launchProgress: number;
  pointerX: number | null;
  pointerY: number | null;
};

export type SpaceFieldState = {
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  fieldRotation: {
    x: number;
    y: number;
    z: number;
  };
  orbitalOpacity: number;
  starSpeed: number;
  warpStrength: number;
};

export function createSpaceFieldState(input: SpaceFieldInput): SpaceFieldState {
  const pointerX = clamp(input.pointerX ?? 0.5, 0, 1);
  const pointerY = clamp(input.pointerY ?? 0.5, 0, 1);
  const launchProgress = clamp(input.launchProgress, 0, 1);
  const dx = pointerX - 0.5;
  const dy = 0.5 - pointerY;

  return {
    cameraPosition: {
      x: normalizeZero(dx * 0.7),
      y: normalizeZero(0.06 + dy * 0.35),
      z: normalizeZero(6.2 - launchProgress * 1.35)
    },
    fieldRotation: {
      x: normalizeZero(dy * 0.18 - launchProgress * 0.04),
      y: normalizeZero(dx * 0.22 + launchProgress * 0.16),
      z: normalizeZero(-dx * 0.08)
    },
    orbitalOpacity: normalizeZero(0.28 + launchProgress * 0.44),
    starSpeed: normalizeZero(0.16 + launchProgress * 0.84),
    warpStrength: normalizeZero(0.22 + launchProgress * 0.78)
  };
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}
