export type StageRevealInput = {
  cardCount: number;
  scrollY: number;
  viewportHeight: number;
};

export type StageRevealState = {
  cardProgress: number[];
  intensity: number;
  visible: boolean;
};

export function createStageRevealState(input: StageRevealInput): StageRevealState {
  const start = input.viewportHeight * 0.48;
  const range = Math.max(input.viewportHeight * 0.54, 1);
  const intensity = clamp((input.scrollY - start) / range, 0, 1);
  const visible = intensity > 0;
  const cardProgress = Array.from({ length: input.cardCount }, (_, index) => clamp(intensity * 1.82 - index * 0.2, 0, 1));

  return {
    visible,
    intensity,
    cardProgress
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
