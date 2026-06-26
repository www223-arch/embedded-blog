export type RocketLaunchPhase = "idle" | "jet" | "launch";

export type RocketLaunchInput = {
  scrollY: number;
  viewportHeight: number;
};

export type RocketLaunchState = {
  opacity: number;
  phase: RocketLaunchPhase;
  scale: number;
  translateY: number;
};

const SCROLL_THRESHOLD_JET = 30;
const SCROLL_THRESHOLD_LAUNCH = 260;
const SCROLL_MAX_LAUNCH = 960;

export function createRocketLaunchState(input: RocketLaunchInput): RocketLaunchState {
  const scrollY = Math.max(input.scrollY, 0);

  if (scrollY >= SCROLL_THRESHOLD_JET && scrollY < SCROLL_THRESHOLD_LAUNCH) {
    const jetProgress = (scrollY - SCROLL_THRESHOLD_JET) / (SCROLL_THRESHOLD_LAUNCH - SCROLL_THRESHOLD_JET);
    return {
      phase: "jet",
      translateY: jetProgress * 10,
      scale: 1,
      opacity: 1
    };
  }

  if (scrollY >= SCROLL_THRESHOLD_LAUNCH) {
    const launchProgress = Math.min((scrollY - SCROLL_THRESHOLD_LAUNCH) / (SCROLL_MAX_LAUNCH - SCROLL_THRESHOLD_LAUNCH), 1);
    const travelDistance = input.viewportHeight * 0.581 + 120;

    return {
      phase: "launch",
      translateY: -launchProgress * travelDistance,
      scale: 1 - launchProgress * 0.2,
      opacity: 1 - launchProgress * 0.54
    };
  }

  return {
    phase: "idle",
    translateY: 0,
    scale: Math.max(0.85, 1 - (scrollY / SCROLL_THRESHOLD_JET) * 0.15),
    opacity: 1
  };
}
