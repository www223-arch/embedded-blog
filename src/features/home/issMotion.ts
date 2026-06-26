export type IssScenePoseInput = {
  launchProgress: number;
  pointerX: number | null;
  pointerY: number | null;
  time: number;
};

export type IssScenePose = {
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  modelRotation: {
    x: number;
    y: number;
    z: number;
  };
};

export function createIssScenePose(input: IssScenePoseInput): IssScenePose {
  const pointerX = clamp(input.pointerX ?? 0.5, 0, 1);
  const pointerY = clamp(input.pointerY ?? 0.5, 0, 1);
  const launchProgress = clamp(input.launchProgress, 0, 1);
  const dx = pointerX - 0.5;
  const dy = 0.5 - pointerY;

  return {
    modelRotation: {
      x: normalizeZero(dy * 0.7),
      y: normalizeZero(0.36 + dx * 1.4 + launchProgress * 0.2875),
      z: normalizeZero(-dx * 0.11)
    },
    cameraPosition: {
      x: normalizeZero(dx * 2.4),
      y: normalizeZero(0.1 + dy * 0.95 + launchProgress * 0.21875),
      z: normalizeZero(5.4 - launchProgress * 0.93125)
    }
  };
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}
